import { useState } from "react";

export function useToggle(
  defaultValue: boolean = false,
): [boolean, () => void] {
  const [state, setState] = useState(defaultValue);

  return [state, () => setState(!state)];
}
