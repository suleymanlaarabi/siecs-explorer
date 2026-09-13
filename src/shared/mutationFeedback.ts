import { toaster } from '../components/ui/toaster-provider';

export function showMutationError(title: string, error: unknown) {
  toaster.create({
    title,
    description: error instanceof Error ? error.message : 'Unknown error',
    type: 'error',
    closable: true,
  });
}

export function showMutationSuccess(title: string) {
  toaster.create({ title, type: 'success' });
}
