import { Field } from '@chakra-ui/react';
import type { EntityRef } from '../../../lib/siecs/types';
import { EntityPicker } from '../EntityPicker';

export function EntityEditor({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: unknown;
  error?: string | undefined;
  onChange: (value: EntityRef) => void;
}) {
  return (
    <Field.Root invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <EntityPicker
        value={typeof value === 'number' ? value : undefined}
        onChange={onChange}
        label={`Select entity for ${label}`}
      />
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}
