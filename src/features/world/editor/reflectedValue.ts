import type { ComponentDef, EditorType, TypeDef } from '../../../lib/siecs/types';

export type ParsedValue = { ok: true; value: unknown } | { ok: false; error: string };

export function parseEditorValue(editor: EditorType, raw: string): ParsedValue {
  if (editor === 'string') return { ok: true, value: raw };
  if (editor === 'number' || editor === 'entity') {
    if (raw.trim() === '') return { ok: false, error: 'A number is required' };
    const value = Number(raw);
    if (!Number.isFinite(value)) return { ok: false, error: 'Enter a valid number' };
    if (editor === 'entity' && (!Number.isInteger(value) || value < 0)) {
      return { ok: false, error: 'Enter a valid entity id' };
    }
    return { ok: true, value };
  }
  if (editor === 'object') {
    if (raw.trim() === '') return { ok: false, error: 'Enter valid JSON' };
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      return { ok: false, error: 'Enter valid JSON' };
    }
  }
  return { ok: false, error: 'This field cannot be edited' };
}

export function createRawValues(
  component: ComponentDef,
  value: unknown,
  typeById: Map<number, TypeDef>,
) {
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

export function formatEditorValue(editor: EditorType, value: unknown): string {
  if (editor === 'object') {
    if (value === undefined) return '';
    try {
      return JSON.stringify(value, null, 2) ?? '';
    } catch {
      return '';
    }
  }
  return value === undefined || value === null ? '' : String(value);
}

export function updateObjectField(value: unknown, key: string, nextValue: unknown) {
  return { ...(isRecord(value) ? value : {}), [key]: nextValue };
}

export function getObjectField(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined;
}

export function removeKey<T>(object: Record<string, T>, key: string) {
  const next = { ...object };
  delete next[key];
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
