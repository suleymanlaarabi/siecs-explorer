import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-jsonrpc/browser";
import type { Message } from "vscode-jsonrpc";
import type { WorkspaceFile } from "./headers";
import { LspFrameParser } from "./lspFrameParser";

type BootstrapMessage = {
  type: "bootstrap";
  port: MessagePort;
  files: WorkspaceFile[];
};

type ClangdModule = {
  FS: {
    analyzePath(path: string): { exists: boolean };
    mkdirTree(path: string): void;
    writeFile(path: string, data: string): void;
  };
  callMain(args: string[]): void;
};

type ClangdFactory = (
  options: Record<string, unknown>,
) => Promise<ClangdModule>;

type SysrootManifest = {
  files: Array<{ path: string; url: string }>;
};

const CLANGD_ASSET_VERSION = "22.1.8-headers1";
const CLANGD_RESOURCE_DIR = "/usr/lib/clang/22";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function postStatus(type: "ready" | "error", message?: string) {
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  self.postMessage({ type, message });
}

async function loadClangdFactory(): Promise<ClangdFactory> {
  const moduleUrl = new URL("/clangd/clangd.js", self.location.origin);
  moduleUrl.searchParams.set("v", CLANGD_ASSET_VERSION);
  const module = (await import(/* @vite-ignore */ moduleUrl.href)) as {
    default?: ClangdFactory;
  };
  if (!module.default)
    throw new Error(
      "public/clangd/clangd.js must export the Emscripten module factory.",
    );
  return module.default;
}

function assertEmbeddedClangHeaders(clangd: ClangdModule) {
  const stddefPath = `${CLANGD_RESOURCE_DIR}/include/stddef.h`;
  if (!clangd.FS.analyzePath(stddefPath).exists) {
    throw new Error(
      `The clangd bundle is missing its builtin headers (${stddefPath}).`,
    );
  }
}

async function mountFiles(clangd: ClangdModule, files: WorkspaceFile[]) {
  for (const file of files) {
    const separator = file.path.lastIndexOf("/");
    clangd.FS.mkdirTree(file.path.slice(0, separator));
    clangd.FS.writeFile(file.path, file.content);
  }
}

async function mountSysroot(clangd: ClangdModule) {
  const manifestUrl = new URL(
    "/clangd/sysroot.manifest.json",
    self.location.origin,
  );
  const response = await fetch(manifestUrl);
  // Vite's SPA fallback responds with index.html (200) when this optional file
  // is absent. The distributed clangd WASM already embeds its standard headers.
  if (
    response.status === 404 ||
    !response.headers.get("content-type")?.includes("application/json")
  )
    return;
  if (!response.ok)
    throw new Error(
      `Unable to load the clangd sysroot manifest (${response.status}).`,
    );
  const manifest = (await response.json()) as SysrootManifest;
  if (!Array.isArray(manifest.files))
    throw new Error("The clangd sysroot manifest is invalid.");

  const files = await Promise.all(
    manifest.files.map(async (file): Promise<WorkspaceFile> => {
      if (!file.path.startsWith("/") || file.path.includes("..")) {
        throw new Error("The clangd sysroot manifest contains an unsafe path.");
      }
      const content = await (
        await fetch(new URL(file.url, self.location.origin))
      ).text();
      return { path: file.path, content };
    }),
  );
  await mountFiles(clangd, files);
}

async function bootstrap({ port, files }: BootstrapMessage) {
  const reader = new BrowserMessageReader(port);
  const writer = new BrowserMessageWriter(port);
  const stdinChunks: Uint8Array[] = [];
  let stdinChunkIndex = 0;
  let stdinChunkOffset = 0;
  let wakeStdin: (() => void) | undefined;

  reader.listen((message) => {
    const body = encoder.encode(JSON.stringify(message));
    const header = encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`);
    const frame = new Uint8Array(header.byteLength + body.byteLength);
    frame.set(header);
    frame.set(body, header.byteLength);
    stdinChunks.push(frame);
    wakeStdin?.();
    wakeStdin = undefined;
  });

  const readStdinByte = () => {
    const chunk = stdinChunks[stdinChunkIndex];
    if (!chunk) return null;

    const byte = chunk[stdinChunkOffset++];
    if (stdinChunkOffset === chunk.byteLength) {
      stdinChunkIndex += 1;
      stdinChunkOffset = 0;
      if (stdinChunkIndex > 32 && stdinChunkIndex * 2 > stdinChunks.length) {
        stdinChunks.splice(0, stdinChunkIndex);
        stdinChunkIndex = 0;
      }
    }
    return byte;
  };

  const factory = await loadClangdFactory();
  const output = new LspFrameParser((payload) => {
    try {
      void writer.write(JSON.parse(decoder.decode(payload)) as Message);
    } catch {
      // Keep clangd running if it emits one malformed response.
    }
  });
  const clangd = await factory({
    thisProgram: "/usr/bin/clangd",
    locateFile: (path: string) => {
      const assetUrl = new URL(`/clangd/${path}`, self.location.origin);
      assetUrl.searchParams.set("v", CLANGD_ASSET_VERSION);
      return assetUrl.href;
    },
    stdin: readStdinByte,
    stdinReady: () =>
      stdinChunkIndex < stdinChunks.length
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            wakeStdin = resolve;
          }),
    stdout: (byte: number) => output.push(byte),
  });

  assertEmbeddedClangHeaders(clangd);
  await mountSysroot(clangd);
  await mountFiles(clangd, files);

  postStatus("ready");
  clangd.callMain([
    "--background-index=0",
    "--clang-tidy=0",
    "--completion-parse=auto",
    "--completion-style=bundled",
    "--function-arg-placeholders=0",
    "--header-insertion=never",
    "--log=error",
    "--pch-storage=memory",
    `--resource-dir=${CLANGD_RESOURCE_DIR}`,
    "-j=2",
  ]);
}

self.addEventListener("message", (event: MessageEvent<BootstrapMessage>) => {
  if (event.data.type !== "bootstrap") return;
  void bootstrap(event.data).catch((error: unknown) => {
    postStatus(
      "error",
      error instanceof Error ? error.message : "Unable to start clangd.",
    );
  });
});
