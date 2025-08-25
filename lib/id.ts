export function genId(prefix?: string) {
  const id = (globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID());
  return prefix ? `${prefix}_${id}` : id;
}
