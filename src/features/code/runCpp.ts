import { useQueryClient } from '@tanstack/react-query';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { siecsClient, type LoadedModule } from '../../lib/siecs/client';
import { headerSourcesAtom, loadWorkspaceHeaders } from './headers';

type RunStatus = {
  tone: 'error' | 'success' | 'warning';
  message: string;
};

const compilerUrl = import.meta.env['VITE_CPP_COMPILER_URL'] ?? 'http://127.0.0.1:3001';

export const cppCodeAtom = atom('');
export const cppRunPendingAtom = atom(false);
export const cppRunStatusAtom = atom<RunStatus | undefined>(undefined);

async function responseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; diagnostics?: string };
    return (
      body.diagnostics?.trim().slice(0, 4_000) ||
      body.error ||
      `Request failed (${response.status}).`
    );
  } catch {
    return `Request failed (${response.status}).`;
  }
}

export function useRunCppModule() {
  const code = useAtomValue(cppCodeAtom);
  const headerSources = useAtomValue(headerSourcesAtom);
  const [pending, setPending] = useAtom(cppRunPendingAtom);
  const setStatus = useSetAtom(cppRunStatusAtom);
  const queryClient = useQueryClient();

  const run = useCallback(async (): Promise<LoadedModule | undefined> => {
    if (pending) return undefined;

    setPending(true);
    setStatus({ tone: 'warning', message: 'Compiling C++23 module…' });
    try {
      const headers = await loadWorkspaceHeaders(headerSources);
      if (headers.failures.length > 0) {
        throw new Error(headers.failures.map((failure) => failure.message).join('\n'));
      }

      const compileResponse = await fetch(`${compilerUrl}/compile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code,
          headers: headers.files.map((file) => ({
            path: file.path.replace('/workspace/include/', ''),
            content: file.content,
          })),
        }),
      });
      if (!compileResponse.ok) throw new Error(await responseError(compileResponse));

      setStatus({ tone: 'warning', message: 'Loading C++ module…' });
      const module = await siecsClient.loadModule(await compileResponse.arrayBuffer());
      await queryClient.invalidateQueries();
      setStatus({
        tone: 'success',
        message: module.replaced
          ? `C++ module reloaded (${module.id}).`
          : `C++ module loaded (${module.id}).`,
      });
      return module;
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to run the C++ module.',
      });
      return undefined;
    } finally {
      setPending(false);
    }
  }, [code, headerSources, pending, queryClient, setPending, setStatus]);

  return { pending, run };
}
