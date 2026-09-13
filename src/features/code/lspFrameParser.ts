const headerTerminator = [13, 10, 13, 10] as const;

/** Parses Content-Length framed LSP output in one pass, with one allocation per payload. */
export class LspFrameParser {
  private readonly header: number[] = [];
  private terminatorOffset = 0;
  private payload: Uint8Array | undefined;
  private payloadOffset = 0;
  private readonly onPayload: (payload: Uint8Array) => void;

  constructor(onPayload: (payload: Uint8Array) => void) {
    this.onPayload = onPayload;
  }

  push(byte: number) {
    if (this.payload) {
      this.payload[this.payloadOffset] = byte;
      this.payloadOffset += 1;
      if (this.payloadOffset === this.payload.byteLength) this.emitPayload();
      return;
    }

    this.header.push(byte);
    this.terminatorOffset =
      byte === headerTerminator[this.terminatorOffset] ? this.terminatorOffset + 1 : byte === 13 ? 1 : 0;
    if (this.terminatorOffset !== headerTerminator.length) return;

    const headerText = new TextDecoder().decode(new Uint8Array(this.header.slice(0, -headerTerminator.length)));
    const rawLength = /content-length:\s*(\d+)/i.exec(headerText)?.[1];
    this.header.length = 0;
    this.terminatorOffset = 0;
    if (!rawLength) return;

    const contentLength = Number(rawLength);
    if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return;
    this.payload = new Uint8Array(contentLength);
    this.payloadOffset = 0;
  }

  private emitPayload() {
    const payload = this.payload;
    this.payload = undefined;
    this.payloadOffset = 0;
    if (payload) this.onPayload(payload);
  }
}
