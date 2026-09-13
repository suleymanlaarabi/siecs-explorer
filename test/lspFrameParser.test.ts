import { describe, expect, test } from 'bun:test';
import { LspFrameParser } from '../src/features/code/lspFrameParser';

const encoder = new TextEncoder();

function frame(value: unknown) {
  const body = encoder.encode(JSON.stringify(value));
  const header = encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`);
  return new Uint8Array([...header, ...body]);
}

describe('LSP frame parser', () => {
  test('streams consecutive messages without rescanning partial payloads', () => {
    const payloads: unknown[] = [];
    const parser = new LspFrameParser((payload) => payloads.push(JSON.parse(new TextDecoder().decode(payload))));

    for (const byte of frame({ id: 1, result: ['ecs::init', 'ecs::fini'] })) parser.push(byte);
    for (const byte of frame({ method: 'textDocument/publishDiagnostics', params: [] })) parser.push(byte);

    expect(payloads).toEqual([
      { id: 1, result: ['ecs::init', 'ecs::fini'] },
      { method: 'textDocument/publishDiagnostics', params: [] },
    ]);
  });
});
