import { atomWithStorage } from 'jotai/utils';

export type HeaderSource = {
  id: string;
  url: string;
  virtualPath: string;
};

export type WorkspaceFile = {
  path: string;
  content: string;
};

export type HeaderLoadFailure = {
  source: HeaderSource;
  message: string;
};

const HEADER_SOURCES_STORAGE_KEY = 'siecs-explorer.cpp-header-sources.v1';
const INCLUDE_ROOT = '/workspace/include';
const CLANGD_COMPILE_FLAGS = [
  '-xc++',
  '-std=c++23',
  '--target=wasm32-wasi',
  '-I/workspace/include',
  '-isystem/usr/include/c++/v1',
  '-isystem/usr/include/wasm32-wasi/c++/v1',
  '-isystem/usr/include',
  '-isystem/usr/include/wasm32-wasi',
];

export const defaultHeaderSources: HeaderSource[] = [
  {
    id: 'siecs',
    url: 'https://raw.githubusercontent.com/suleymanlaarabi/siecs/refs/heads/main/distr/siecs.h',
    virtualPath: 'siecs/siecs.h',
  },
];

export const headerSourcesAtom = atomWithStorage<HeaderSource[]>(
  HEADER_SOURCES_STORAGE_KEY,
  defaultHeaderSources,
);

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `header-${Date.now()}-${Math.random()}`;
}

export function createHeaderSource(): HeaderSource {
  return { id: createId(), url: '', virtualPath: '' };
}

export function validateHeaderSource(source: HeaderSource): string | undefined {
  try {
    const url = new URL(source.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return 'Header URLs must use HTTP or HTTPS.';
    }
  } catch {
    return 'Header URL is invalid.';
  }

  if (
    !source.virtualPath ||
    source.virtualPath.startsWith('/') ||
    source.virtualPath.includes('..')
  ) {
    return 'Virtual paths must stay below /workspace/include.';
  }

  return undefined;
}

export async function loadWorkspaceHeaders(sources: HeaderSource[]): Promise<{
  files: WorkspaceFile[];
  failures: HeaderLoadFailure[];
}> {
  const results = await Promise.all(
    sources.map(async (source): Promise<WorkspaceFile | HeaderLoadFailure> => {
      const validationError = validateHeaderSource(source);
      if (validationError) return { source, message: validationError };

      try {
        const response = await fetch(source.url);
        if (!response.ok) {
          return { source, message: `Download failed (${response.status}).` };
        }
        return {
          path: `${INCLUDE_ROOT}/${source.virtualPath}`,
          content: await response.text(),
        };
      } catch {
        return {
          source,
          message: 'The header could not be downloaded (CORS or network error).',
        };
      }
    }),
  );

  const files: WorkspaceFile[] = [];
  const failures: HeaderLoadFailure[] = [];
  for (const result of results) {
    if ('source' in result) failures.push(result);
    else files.push(result);
  }
  return { files, failures };
}

export function createCppWorkspace(headers: WorkspaceFile[]): WorkspaceFile[] {
  return [
    {
      path: '/workspace/.clangd',
      content: `CompileFlags:\n  Add: [${CLANGD_COMPILE_FLAGS.join(', ')}]\nCompletion:\n  AllScopes: No\n  ArgumentLists: Delimiters\n  HeaderInsertion: Never\n  CodePatterns: None\n`,
    },
    {
      path: '/workspace/main.cpp',
      content: `#include <siecs/siecs.h>\n\nvoid setup() {\n    // Register systems, observers, and other module content here.\n}\n`,
    },
    ...headers,
  ];
}
