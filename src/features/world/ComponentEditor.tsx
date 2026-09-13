import { useQueryClient } from "@tanstack/react-query";
import { Checkbox, Field, Input, Text, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  siecsClient,
  type ComponentDef,
  type EditorType,
  type EntityComponent,
  type EntityDetail,
  type EntityRef,
  type Schema,
  type TypeDef,
} from "../../client";

const COMPONENT_SAVE_DEBOUNCE_MS = 300;

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";
type ParsedValue = { ok: true; value: unknown } | { ok: false; error: string };

export function EntityComponentEditor({
  entity,
  component,
  schema,
  entityComponent,
}: {
  entity: EntityRef;
  component: ComponentDef;
  schema: Schema;
  entityComponent: EntityComponent;
}) {
  const queryClient = useQueryClient();
  const typeById = useMemo(
    () => new Map(schema.types.map((type) => [type.id, type])),
    [schema.types],
  );
  const [draft, setDraft] = useState(entityComponent.value);
  const [rawValues, setRawValues] = useState<Record<string, string>>(() =>
    createRawValues(component, entityComponent.value, typeById),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string>();
  const pendingRef = useRef<unknown | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);
  const queryKey = useMemo(
    () => ["entity", entity.index, entity.generation],
    [entity.index, entity.generation],
  );

  const flushSave = useCallback(async () => {
    if (savingRef.current || pendingRef.current === undefined) return;

    const value = pendingRef.current;
    pendingRef.current = undefined;
    savingRef.current = true;
    if (mountedRef.current) {
      setSaveState("saving");
      setSaveError(undefined);
    }

    try {
      const saved = await siecsClient.setComponent(entity, component.id, value);
      queryClient.setQueryData<EntityDetail>(queryKey, (current) =>
        current
          ? {
              ...current,
              components: current.components.map((item) => (item.id === saved.id ? saved : item)),
            }
          : current,
      );
      if (mountedRef.current) setSaveState("saved");
    } catch (error) {
      if (mountedRef.current) {
        setSaveState("error");
        setSaveError(error instanceof Error ? error.message : "Save failed");
      }
    } finally {
      savingRef.current = false;
      if (mountedRef.current && pendingRef.current !== undefined) {
        void flushSave();
      }
    }
  }, [component.id, entity, queryClient, queryKey]);

  const scheduleSave = useCallback(
    (value: unknown) => {
      pendingRef.current = value;
      setSaveState("pending");
      setSaveError(undefined);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined;
        void flushSave();
      }, COMPONENT_SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const update = (key: string, type: TypeDef, raw: string) => {
    setRawValues((current) => ({ ...current, [key]: raw }));
    const parsed = parseEditorValue(type.editor, raw);
    if (!parsed.ok) {
      setErrors((current) => ({ ...current, [key]: parsed.error }));
      return;
    }

    setErrors((current) => removeKey(current, key));
    const next =
      component.fields.length === 0 ? parsed.value : updateObjectField(draft, key, parsed.value);
    setDraft(next);
    scheduleSave(next);
  };

  const updateBoolean = (key: string, value: boolean) => {
    const next = component.fields.length === 0 ? value : updateObjectField(draft, key, value);
    setErrors((current) => removeKey(current, key));
    setDraft(next);
    scheduleSave(next);
  };

  const fields =
    component.fields.length > 0
      ? component.fields.map((field) => ({
          key: field.name,
          label: field.name,
          type: typeById.get(field.type),
          value: getObjectField(draft, field.name),
        }))
      : [
          {
            key: "value",
            label: "Value",
            type: typeById.get(component.type),
            value: draft,
          },
        ];

  return (
    <VStack align="stretch" gap="4">
      <SaveStatus state={saveState} error={saveError} />
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
            onBooleanChange={(value) => updateBoolean(field.key, value)}
          />
        ))}
      </VStack>
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
}: {
  label: string;
  type?: TypeDef;
  value: unknown;
  rawValue?: string;
  error?: string;
  onChange: (value: string) => void;
  onBooleanChange: (value: boolean) => void;
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

  const displayValue = rawValue ?? formatEditorValue(type.editor, value);
  return (
    <Field.Root orientation={"horizontal"} invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Text textStyle="xs" color="fg.muted">
        {type.name}
      </Text>
      <Input
        ml={1}
        type={type.editor === "number" || type.editor === "entity" ? "number" : "text"}
        value={displayValue}
        onChange={(event) => onChange(event.target.value)}
        step={type.editor === "entity" ? "1" : "any"}
      />
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}

function SaveStatus({ state, error }: { state: SaveState; error?: string }) {
  if (state === "idle") return null;
  const text =
    state === "pending"
      ? "Modifying…"
      : state === "saving"
        ? "Saving…"
        : state === "saved"
          ? "Saved"
          : error || "Save failed";
  return (
    <Text textStyle="xs" color={state === "error" ? "fg.error" : "fg.muted"}>
      {text}
    </Text>
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

function parseEditorValue(editor: EditorType, raw: string): ParsedValue {
  if (editor === "string") return { ok: true, value: raw };
  if (editor === "number" || editor === "entity") {
    if (raw.trim() === "") return { ok: false, error: "A number is required" };
    const value = Number(raw);
    if (!Number.isFinite(value)) return { ok: false, error: "Enter a valid number" };
    if (editor === "entity" && (!Number.isInteger(value) || value < 0)) {
      return { ok: false, error: "Enter a valid entity id" };
    }
    return { ok: true, value };
  }
  if (editor === "object") {
    if (raw.trim() === "") return { ok: false, error: "Enter valid JSON" };
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      return { ok: false, error: "Enter valid JSON" };
    }
  }
  return { ok: false, error: "This field cannot be edited" };
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
