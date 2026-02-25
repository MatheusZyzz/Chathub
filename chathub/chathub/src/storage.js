// ─── PERSISTENT STORAGE (localStorage) ───

export function storageGet(key) {
  try {
    const val = localStorage.getItem(`chathub:${key}`);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export function storageSet(key, val) {
  try {
    localStorage.setItem(`chathub:${key}`, JSON.stringify(val));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

export function storageDelete(key) {
  try {
    localStorage.removeItem(`chathub:${key}`);
  } catch (e) {
    console.error("Storage delete error:", e);
  }
}

export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw + "chathub-salt-2024");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
