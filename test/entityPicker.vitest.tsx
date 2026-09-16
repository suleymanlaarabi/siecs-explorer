import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { EntityPicker } from '../src/features/world/EntityPicker';

const entities = [
  { name: 'Source', index: 1, generation: 1 },
  { name: 'Reused slot', index: 1, generation: 2 },
  { name: 'Other', index: 2, generation: 1 },
];

vi.mock('../src/features/world/api/entityQueries', () => ({
  useAllEntities: () => ({ data: entities, isLoading: false, error: null }),
}));

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);

function renderPicker(exclude?: (typeof entities)[number]) {
  const onChange = vi.fn();
  const view = render(
    <ChakraProvider value={defaultSystem}>
      <EntityPicker exclude={exclude} onChange={onChange} />
    </ChakraProvider>,
  );
  return { ...view, onChange };
}

describe('EntityPicker', () => {
  test('excludes only the entity matching the full identity', async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker(entities[0]);

    await user.click(screen.getByRole('button', { name: 'Select entity' }));

    expect(screen.queryByRole('option', { name: /Source/ })).toBeNull();
    expect(screen.getByRole('option', { name: /Reused slot/ })).toBeTruthy();
    await user.click(screen.getByRole('option', { name: /Other/ }));
    expect(onChange).toHaveBeenCalledWith(entities[2]);
  });

  test('shows every entity when no exclusion is provided', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: 'Select entity' }));

    expect(screen.getByRole('option', { name: /Source/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Reused slot/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Other/ })).toBeTruthy();
  });
});
