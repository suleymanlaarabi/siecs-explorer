import type { EditorType } from '../../../client';

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
