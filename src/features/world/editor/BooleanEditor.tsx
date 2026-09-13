import { Checkbox } from '@chakra-ui/react';

export function BooleanEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: boolean) => void;
}) {
  return (
    <Checkbox.Root
      checked={value === true}
      onCheckedChange={(details) => onChange(details.checked === true)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  );
}
