import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { siecsClient } from '../src/lib/siecs/client';
import { SceneActions } from '../src/features/world/SceneActions';
import { entityKeys } from '../src/features/world/api/queryKeys';

const { downloadBlobMock } = vi.hoisted(() => ({ downloadBlobMock: vi.fn() }));

vi.mock('../src/utils/downloadBlob', () => ({ downloadBlob: downloadBlobMock }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  downloadBlobMock.mockReset();
});

function renderSceneActions() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={queryClient}>
        <SceneActions />
      </QueryClientProvider>
    </ChakraProvider>,
  );
  return { ...view, queryClient };
}

describe('SceneActions', () => {
  test('renders labelled save and load icon buttons', () => {
    renderSceneActions();

    expect(screen.getByRole('button', { name: 'Save scene' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Load scene' })).toBeTruthy();
  });

  test('confirms a selected file, can cancel, and can select the same file again', async () => {
    const user = userEvent.setup();
    const load = vi.spyOn(siecsClient, 'loadScene').mockResolvedValue();
    const { container, queryClient } = renderSceneActions();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([0, 1, 2])], 'scene.siecs', {
      type: 'application/octet-stream',
    });

    await user.upload(input, file);
    expect(screen.getByRole('dialog').textContent).toContain('scene.siecs');
    expect(screen.getByRole('dialog').textContent).toContain(
      'Existing entities will not be removed',
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(load).not.toHaveBeenCalled();

    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Load', exact: true }));

    await waitFor(() => expect(load).toHaveBeenCalledWith(file));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: entityKeys.roots() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: entityKeys.list() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: entityKeys.all });
  });

  test('downloads a saved scene and prevents a second operation while pending', async () => {
    const user = userEvent.setup();
    let resolveSave!: (blob: Blob) => void;
    const save = vi
      .spyOn(siecsClient, 'saveScene')
      .mockImplementation(() => new Promise((resolve) => (resolveSave = resolve)));
    renderSceneActions();

    const saveButton = screen.getByRole('button', { name: 'Save scene' });
    const loadButton = screen.getByRole('button', { name: 'Load scene' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(save).toHaveBeenCalledTimes(1);
      expect(loadButton.getAttribute('disabled')).not.toBeNull();
    });

    resolveSave(new Blob([new Uint8Array([0])], { type: 'application/octet-stream' }));
    await waitFor(() => expect(downloadBlobMock).toHaveBeenCalledTimes(1));
  });
});
