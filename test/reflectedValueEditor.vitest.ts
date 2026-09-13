import { describe, expect, test } from 'vitest';
import { parseEditorValue } from '../src/features/world/editor/reflectedValue';

describe('ReflectedValueEditor parsing', () => {
  test('parses numbers and rejects invalid numbers', () => {
    expect(parseEditorValue('number', '12.5')).toEqual({ ok: true, value: 12.5 });
    expect(parseEditorValue('number', 'not a number').ok).toBe(false);
  });

  test('keeps strings unchanged', () => {
    expect(parseEditorValue('string', 'hello')).toEqual({ ok: true, value: 'hello' });
  });

  test('parses valid entity ids and rejects invalid ids', () => {
    expect(parseEditorValue('entity', '42')).toEqual({ ok: true, value: 42 });
    expect(parseEditorValue('entity', '1.5').ok).toBe(false);
  });

  test('parses valid JSON and reports invalid JSON', () => {
    expect(parseEditorValue('object', '{"x":12}')).toEqual({ ok: true, value: { x: 12 } });
    expect(parseEditorValue('object', '{invalid')).toEqual({
      ok: false,
      error: 'Enter valid JSON',
    });
  });
});
