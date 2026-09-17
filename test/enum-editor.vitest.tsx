import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { ComponentDef, Schema } from '../src/lib/siecs/types';
import { ReflectedValueEditor } from '../src/features/world/editor/ReflectedValueEditor';
import { createComponentDraft } from '../src/features/world/editor/reflectedValue';

const component: ComponentDef = {
  id: 10,
  name: 'RestEnumComponent',
  isRelation: false,
  type: 100,
  fields: [{ name: 'mode', type: 101 }],
};

const schema: Schema = {
  components: [component],
  relations: [],
  types: [
    { id: 100, name: 'RestEnumComponent', editor: 'object' },
    {
      id: 101,
      name: 'RestMode',
      editor: 'enum',
      options: ['REST_MODE_IDLE', 'REST_MODE_RUN', 'REST_MODE_PAUSED'],
    },
  ],
};

describe('enum reflected editor', () => {
  test('creates a draft with the first symbolic enum option', () => {
    const typeById = new Map(schema.types.map((type) => [type.id, type]));

    expect(createComponentDraft(component, typeById)).toEqual({
      mode: 'REST_MODE_IDLE',
    });
  });

  test('renders enum options and emits the selected symbolic name', () => {
    const onChange = vi.fn();

    render(
      <ChakraProvider value={defaultSystem}>
        <ReflectedValueEditor
          component={component}
          schema={schema}
          value={{ mode: 'REST_MODE_RUN' }}
          onChange={onChange}
          onValidityChange={() => {}}
        />
      </ChakraProvider>,
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;

    expect(select.value).toBe('REST_MODE_RUN');
    expect(Array.from(select.options, (option) => option.value)).toEqual([
      'REST_MODE_IDLE',
      'REST_MODE_RUN',
      'REST_MODE_PAUSED',
    ]);

    fireEvent.change(select, { target: { value: 'REST_MODE_PAUSED' } });

    expect(onChange).toHaveBeenLastCalledWith({ mode: 'REST_MODE_PAUSED' });
  });
});
