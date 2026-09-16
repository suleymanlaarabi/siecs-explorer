import { Field, Text } from '@chakra-ui/react';
import type { EntityRef, TypeDef } from '../../../lib/siecs/types';
import { BooleanEditor } from './BooleanEditor';
import { EntityEditor } from './EntityEditor';
import { ObjectEditor } from './ObjectEditor';
import { ScalarEditor } from './ScalarEditor';
import { formatEditorValue } from './reflectedValue';

export function EditorField({
  label,
  type,
  value,
  rawValue,
  error,
  onChange,
  onBooleanChange,
  onEntityChange,
}: {
  label: string;
  type?: TypeDef | undefined;
  value: unknown;
  rawValue?: string | undefined;
  error?: string | undefined;
  onChange: (value: string) => void;
  onBooleanChange: (value: boolean) => void;
  onEntityChange: (value: EntityRef) => void;
}) {

  if (!type || type.editor === 'unsupported') {
    return (
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <Text textStyle="sm" color="fg.muted">
          Unsupported field type{type?.name ? `: ${type.name}` : ''}
        </Text>
      </Field.Root>
    );
  }
  if (type.editor === 'boolean')
    return <BooleanEditor label={label} value={value} onChange={onBooleanChange} />;
  if (type.editor === 'entity')
    return <EntityEditor label={label} value={value} error={error} onChange={onEntityChange} />;
  const displayValue = rawValue ?? formatEditorValue(type.editor, value);
  return type.editor === 'object' ? (
    <ObjectEditor
      label={label}
      typeName={type.name}
      value={displayValue}
      error={error}
      onChange={onChange}
    />
  ) : (
    <ScalarEditor
      label={label}
      type={type}
      value={displayValue}
      error={error}
      onChange={onChange}
    />
  );
}
