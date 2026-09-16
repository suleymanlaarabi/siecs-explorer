import { useEffect, useMemo, useState } from "react";
import type { ComponentDef, Schema, TypeDef } from "../../../lib/siecs/types";
import {
  createRawValues,
  getObjectField,
  parseEditorValue,
  removeKey,
  updateObjectField,
} from "./reflectedValue";

const EMPTY_ERRORS: Record<string, string> = {};

export function useReflectedValueEditor({
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
  const typeById = useMemo(
    () => new Map(schema.types.map((type) => [type.id, type])),
    [schema.types],
  );
  const [rawState, setRawState] = useState(() => ({
    value,
    values: createRawValues(component, value, typeById),
  }));
  const [errorState, setErrorState] = useState(() => ({
    value,
    errors: EMPTY_ERRORS,
  }));
  const rawValues =
    rawState.value === value
      ? rawState.values
      : createRawValues(component, value, typeById);
  const errors = errorState.value === value ? errorState.errors : EMPTY_ERRORS;
  useEffect(
    () => onValidityChange(Object.keys(errors).length === 0),
    [errors, onValidityChange],
  );
  const update = (key: string, type: TypeDef, raw: string) => {
    setRawState((current) => ({
      value,
      values: {
        ...(current.value === value ? current.values : rawValues),
        [key]: raw,
      },
    }));
    const parsed = parseEditorValue(type.editor, raw);
    if (!parsed.ok) {
      setErrorState((current) => ({
        value,
        errors: {
          ...(current.value === value ? current.errors : EMPTY_ERRORS),
          [key]: parsed.error,
        },
      }));
      return;
    }
    setErrorState((current) => ({
      value,
      errors: removeKey(
        current.value === value ? current.errors : EMPTY_ERRORS,
        key,
      ),
    }));
    onChange(
      component.fields.length === 0
        ? parsed.value
        : updateObjectField(value, key, parsed.value),
    );
  };
  const updateBoolean = (key: string, nextValue: boolean) => {
    setErrorState((current) => ({
      value,
      errors: removeKey(
        current.value === value ? current.errors : EMPTY_ERRORS,
        key,
      ),
    }));
    onChange(
      component.fields.length === 0
        ? nextValue
        : updateObjectField(value, key, nextValue),
    );
  };
  const fields =
    component.fields.length > 0
      ? component.fields.map((field) => ({
          key: field.name,
          label: field.name,
          type: typeById.get(field.type),
          value: getObjectField(value, field.name),
        }))
      : [];
  return { fields, rawValues, errors, update, updateBoolean };
}
