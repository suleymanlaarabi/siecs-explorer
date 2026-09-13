import { VStack } from '@chakra-ui/react';
import type { ComponentDef, Schema } from '../../../lib/siecs/types';
import { EditorField } from './EditorField';
import { useReflectedValueEditor } from './useReflectedValueEditor';

export function ReflectedValueEditor({
  component,
  schema,
  value,
  onChange,
  onValidityChange,
}: {
  component: ComponentDef;
  schema: Schema;
  value: unknown;
  onChange: (value: unknown) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const editor = useReflectedValueEditor({ component, schema, value, onChange, onValidityChange });

  return (
    <VStack align="stretch" gap="4">
      {editor.fields.map((field) => (
        <EditorField
          key={field.key}
          label={field.label}
          type={field.type}
          value={field.value}
          rawValue={editor.rawValues[field.key]}
          error={editor.errors[field.key]}
          onChange={(raw) => field.type && editor.update(field.key, field.type, raw)}
          onBooleanChange={(nextValue) => editor.updateBoolean(field.key, nextValue)}
          onEntityChange={(nextValue) =>
            field.type && editor.update(field.key, field.type, String(nextValue.index))
          }
        />
      ))}
    </VStack>
  );
}
