import { NativeSelect } from '@chakra-ui/react';

export function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <NativeSelect.Root ml="1" size="sm">
      <NativeSelect.Field value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}
