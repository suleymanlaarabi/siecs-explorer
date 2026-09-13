import { Field, Text, Textarea } from '@chakra-ui/react';

export function ObjectEditor({
  label,
  typeName,
  value,
  error,
  onChange,
}: {
  label: string;
  typeName: string;
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <Field.Root orientation="vertical" invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Text textStyle="xs" color="fg.muted">
        {typeName}
      </Text>
      <Textarea
        fontFamily="mono"
        fontSize="sm"
        minH="24"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}
