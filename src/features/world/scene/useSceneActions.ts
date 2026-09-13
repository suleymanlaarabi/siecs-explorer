import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { siecsClient } from '../../../lib/siecs/client';
import { SiecsError } from '../../../lib/siecs/errors';
import { showMutationSuccess } from '../../../shared/mutationFeedback';
import { downloadBlob } from '../../../utils/downloadBlob';
import { refreshWorldQueries } from '../api/entityQueries';
import { toaster } from '../../../components/ui/toaster-provider';

type SceneOperation = { kind: 'save' } | { kind: 'load'; data: ArrayBuffer | Blob };

export class InvalidSceneFileError extends Error {
  constructor() {
    super('Scene file is empty');
    this.name = 'InvalidSceneFileError';
  }
}

export function useSceneActions() {
  const queryClient = useQueryClient();
  const operationInProgress = useRef(false);
  const mutation = useMutation<Blob | void, unknown, SceneOperation>({
    mutationKey: ['scene'],
    mutationFn: async (operation) => {
      if (operation.kind === 'save') return siecsClient.saveScene();
      if (
        (operation.data instanceof Blob && operation.data.size === 0) ||
        (operation.data instanceof ArrayBuffer && operation.data.byteLength === 0)
      )
        throw new InvalidSceneFileError();
      await siecsClient.loadScene(operation.data);
      return undefined;
    },
    onSuccess: async (result, operation) => {
      if (operation.kind === 'save') {
        downloadBlob(result as Blob, sceneFilename());
        showMutationSuccess('Scene saved');
        return;
      }
      await refreshWorldQueries(queryClient);
      showMutationSuccess('Scene loaded');
    },
    onError: (error, operation) =>
      toaster.create({
        title: sceneErrorTitle(operation.kind, error),
        type: 'error',
        closable: true,
      }),
  });
  const run = (operation: SceneOperation) => {
    if (operationInProgress.current)
      return Promise.reject(new Error('A scene operation is already in progress'));
    operationInProgress.current = true;
    return mutation.mutateAsync(operation).finally(() => {
      operationInProgress.current = false;
    });
  };
  return {
    saveScene: () => run({ kind: 'save' }).then(() => undefined),
    loadScene: (data: ArrayBuffer | Blob) => run({ kind: 'load', data }).then(() => undefined),
    isSaving: mutation.isPending && mutation.variables?.kind === 'save',
    isLoading: mutation.isPending && mutation.variables?.kind === 'load',
    isBusy: mutation.isPending,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
function sceneFilename(date = new Date()): string {
  return `scene-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.siecs`;
}
function sceneErrorTitle(kind: SceneOperation['kind'], error: unknown) {
  if (error instanceof InvalidSceneFileError) return 'Invalid scene file';
  if (!(error instanceof SiecsError)) return 'Connection lost';
  if (kind === 'load' && error.status === 400) return 'Invalid scene file';
  if (kind === 'load' && error.status === 413) return 'Scene file is too large';
  return kind === 'save' ? 'Unable to save scene' : 'Unable to load scene';
}
