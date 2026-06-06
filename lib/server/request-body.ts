export type LimitedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: "missing_body" | "too_large" | "invalid_json" };

export async function readJsonWithByteLimit(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  if (!request.body) {
    return { ok: false, reason: "missing_body" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const bodyText = new TextDecoder().decode(concatChunks(chunks, totalBytes));
    return { ok: true, data: JSON.parse(bodyText) };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

function concatChunks(chunks: Uint8Array[], totalBytes: number) {
  const merged = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return merged;
}
