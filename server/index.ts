import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';

const port = Number.parseInt(Bun.env.PORT ?? '3001', 10);
const maxBodyBytes = 16 * 1024 * 1024;
const maxDiagnosticsBytes = 1024 * 1024;

type HeaderInput = {
  path: string;
  content: string;
};

type CompileInput = {
  code: string;
  headers: HeaderInput[];
};

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function validHeaderPath(path: string): boolean {
  if (!path || path.includes('\0') || path.includes('\\') || path.startsWith('/')) return false;

  const normalized = posix.normalize(path);
  return normalized === path && normalized !== '.' && !normalized.startsWith('../');
}

function parseCompileInput(value: unknown): CompileInput | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const input = value as Partial<CompileInput>;
  if (typeof input.code !== 'string' || !Array.isArray(input.headers)) return undefined;

  const paths = new Set<string>();
  for (const header of input.headers) {
    if (
      !header ||
      typeof header !== 'object' ||
      typeof header.path !== 'string' ||
      typeof header.content !== 'string' ||
      !validHeaderPath(header.path) ||
      paths.has(header.path)
    ) {
      return undefined;
    }
    paths.add(header.path);
  }

  return input as CompileInput;
}

async function compile(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return json({ error: 'request body too large' }, 413);
  }

  let input: CompileInput | undefined;
  try {
    input = parseCompileInput(await request.json());
  } catch {
    return json({ error: 'invalid json body' }, 400);
  }

  if (!input) return json({ error: 'expected code and named headers' }, 400);

  const directory = await mkdtemp(join(tmpdir(), 'siecs-compile-'));
  try {
    const includeDirectory = join(directory, 'include');
    const sourcePath = join(directory, 'module.cpp');
    const outputPath = join(directory, 'module.so');

    await mkdir(includeDirectory, { recursive: true });
    for (const header of input.headers) {
      const headerPath = join(includeDirectory, ...header.path.split('/'));
      await mkdir(dirname(headerPath), { recursive: true });
      await Bun.write(headerPath, header.content);
    }
    await Bun.write(
      sourcePath,
      `${input.code}\n\nextern "C" __attribute__((visibility("default"))) void ecs_module_import() {\n  setup();\n}\n`,
    );

    const compiler = Bun.env.CXX?.trim() || 'clang++';
    const process = Bun.spawn(
      [
        compiler,
        '-std=c++23',
        '-O2',
        '-shared',
        '-fPIC',
        '-I',
        includeDirectory,
        sourcePath,
        '-o',
        outputPath,
      ],
      {
        cwd: directory,
        stdout: 'pipe',
        stderr: 'pipe',
      },
    );

    const [exitCode, stdout, stderr] = await Promise.all([
      process.exited,
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
    ]);

    if (exitCode !== 0) {
      const diagnostics = `${stderr}${stdout}`.slice(0, maxDiagnosticsBytes);
      return json({ error: 'compilation failed', diagnostics }, 422);
    }

    const module = await Bun.file(outputPath).arrayBuffer();
    return new Response(module, {
      status: 200,
      headers: {
        ...corsHeaders,
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="module.so"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown compilation error';
    return json({ error: 'failed to compile module', diagnostics: message }, 500);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${Bun.env.PORT}`);
}

const server = Bun.serve({
  hostname: '127.0.0.1',
  port,
  maxRequestBodySize: maxBodyBytes,
  routes: {
    '/compile': {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: compile,
    },
  },
  fetch: () => json({ error: 'not found' }, 404),
});

console.log(`C++23 compiler listening on ${server.url}`);
