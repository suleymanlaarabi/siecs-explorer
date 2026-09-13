import { Checkbox, Field, Input, Text, Textarea, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import type { ComponentDef, EditorType, EntityRef, Schema, TypeDef } from "../../../client";
import { EntityPicker } from "../EntityPicker";
import { parseEditorValue } from "./reflectedValue";

const EMPTY_ERRORS: Record<string, string> = {};

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
  const typeById = useMemo(
    () => new Map(schema.types.map((type) => [type.id, type])),
    [schema.types],
  );
  const [rawState, setRawState] = useState(() => ({
    value,
    values: createRawValues(component, value, typeById),
  }));
  const [errorState, setErrorState] = useState(() => ({ value, errors: EMPTY_ERRORS }));
  const rawValues =
    rawState.value === value ? rawState.values : createRawValues(component, value, typeById);
  const errors = errorState.value === value ? errorState.errors : EMPTY_ERRORS;

  useEffect(() => {
    onValidityChange(Object.keys(errors).length === 0);
  }, [errors, onValidityChange]);

  const update = (key: string, type: TypeDef, raw: string) => {
    setRawState((current) => ({
      value,
      values: { ...(current.value === value ? current.values : rawValues), [key]: raw },
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
      errors: removeKey(current.value === value ? current.errors : EMPTY_ERRORS, key),
    }));
    onChange(
      component.fields.length === 0 ? parsed.value : updateObjectField(value, key, parsed.value),
    );
  };

  const updateBoolean = (key: string, nextValue: boolean) => {
    setErrorState((current) => ({
      value,
      errors: removeKey(current.value === value ? current.errors : EMPTY_ERRORS, key),
    }));
    onChange(component.fields.length === 0 ? nextValue : updateObjectField(value, key, nextValue));
  };

  const fields =
    component.fields.length > 0
      ? component.fields.map((field) => ({
          key: field.name,
          label: field.name,
          type: typeById.get(field.type),
          value: getObjectField(value, field.name),
        }))
      : [
          {
            key: "value",
            label: "Value",
            type: typeById.get(component.type),
            value,
          },
        ];

  return (
    <VStack align="stretch" gap="4">
      {fields.map((field) => (
        <EditorField
          key={field.key}
          label={field.label}
          type={field.type}
          value={field.value}
          rawValue={rawValues[field.key]}
          error={errors[field.key]}
          onChange={(raw) => field.type && update(field.key, field.type, raw)}
          onBooleanChange={(nextValue) => updateBoolean(field.key, nextValue)}
          onEntityChange={(nextValue) =>
            field.type && update(field.key, field.type, String(nextValue.index))
          }
        />
      ))}
    </VStack>
  );
}

function EditorField({
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
  type?: TypeDef;
  value: unknown;
  rawValue?: string;
  error?: string;
  onChange: (value: string) => void;
  onBooleanChange: (value: boolean) => void;
  onEntityChange: (value: EntityRef) => void;
}) {
  if (!type || type.editor === "unsupported") {
    return (
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <Text textStyle="sm" color="fg.muted">
          Unsupported field type{type?.name ? `: ${type.name}` : ""}
        </Text>
      </Field.Root>
    );
  }

  if (type.editor === "boolean") {
    return (
      <Checkbox.Root
        checked={value === true}
        onCheckedChange={(details) => onBooleanChange(details.checked === true)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>{label}</Checkbox.Label>
      </Checkbox.Root>
    );
  }

  if (type.editor === "entity") {
    return (
      <Field.Root invalid={Boolean(error)}>
        <Field.Label>{label}</Field.Label>
        <EntityPicker
          value={typeof value === "number" ? value : undefined}
          onChange={onEntityChange}
          label={`Select entity for ${label}`}
        />
        {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
      </Field.Root>
    );
  }

  const displayValue = rawValue ?? formatEditorValue(type.editor, value);
  return (
    <Field.Root
      orientation={type.editor === "object" ? "vertical" : "horizontal"}
      invalid={Boolean(error)}
    >
      <Field.Label>{label}</Field.Label>
      <Text textStyle="xs" color="fg.muted">
        {type.name}
      </Text>
      {type.editor === "object" ? (
        <Textarea
          fontFamily="mono"
          fontSize="sm"
          minH="24"
          value={displayValue}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          ml="1"
          type={type.editor === "number" ? "number" : "text"}
          value={displayValue}
          onChange={(event) => onChange(event.target.value)}
          step="any"
        />
      )}
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}

function createRawValues(component: ComponentDef, value: unknown, typeById: Map<number, TypeDef>) {
  if (component.fields.length === 0) {
    const type = typeById.get(component.type);
    return type ? { value: formatEditorValue(type.editor, value) } : {};
  }
  return Object.fromEntries(
    component.fields.flatMap((field) => {
      const type = typeById.get(field.type);
      return type
        ? [[field.name, formatEditorValue(type.editor, getObjectField(value, field.name))]]
        : [];
    }),
  );
}

function formatEditorValue(editor: EditorType, value: unknown) {
  if (editor === "object") {
    if (value === undefined) return "";
    try {
      return JSON.stringify(value, null, 2) ?? "";
    } catch {
      return "";
    }
  }
  return value === undefined || value === null ? "" : String(value);
}

function updateObjectField(value: unknown, key: string, nextValue: unknown) {
  const object = isRecord(value) ? value : {};
  return { ...object, [key]: nextValue };
}

function getObjectField(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined;
}

function removeKey<T>(object: Record<string, T>, key: string) {
  const next = { ...object };
  delete next[key];
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
