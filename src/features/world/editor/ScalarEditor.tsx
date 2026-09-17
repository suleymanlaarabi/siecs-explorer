import { Field, Input, Text } from '@chakra-ui/react';
import type { TypeDef } from '../../../lib/siecs/types';
import { SelectInput } from '../components/SelectInput';

export function ScalarEditor({
  label,
  type,
  value,
  error,
  onChange,
}: {
  label: string;
  type: TypeDef;
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <Field.Root orientation="horizontal" invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Text textStyle="xs" color="fg.muted">
        {type.name}
      </Text>
      {type.editor === 'enum' ? (
        <SelectInput value={value} options={type.options} onChange={onChange} />
      ) : (
        <Input
          ml="1"
          type={type.editor === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          step="any"
        />
      )}
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}
