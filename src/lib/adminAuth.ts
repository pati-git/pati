const ADMIN_AUTH_STORAGE_KEY = "crochet_by_pati_admin_session";

// Hash SHA-256 de mots de passe autorisés pour l'administratrice (hors ligne / autonome)
const AUTHORIZED_HASHES = [
  "382e00d9af8cb29ca646f715c06169aad00c40a0a2c188d42297a4e6d445b7c8", // patiscollection@2026!
  "995c924181210bd4c4361c3a275040340036bfe35823909208a71514f4292fba", // paticrochet
  "2c08b0db0e0dbc51dea8cc0211c4c19d8d50fd6e633a7d3ebe78de71d1c8e2c0", // PatiCrochet2026
  "5e540ef5df2aef7c84e5f3251fdcd22fdaad6f1da15bcf5f27a53b3c0faa9676", // paty2026
  "e5a1dc899208ecbfcdc33410a2b031380975eedda87825bef1cadb4e3ac429d6", // 2290193552294
  "9c0b0597da449b335738d2457106c9eef170cdec8e826edf3290827d4809c206", // crochetbypati
  "c038d84423ebfc700aed7d05eac5e52ca318c195a4e6dc8d7c704d1ff69dbd2f", // crochet2026
  "6051fc84a7a0d74c225fb18a496b09952da5642e60723ecae543298edd7d82d6", // admin2026
];

export async function hashPassword(pwd: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isLocalAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) || localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data && data.authenticated === true;
  } catch {
    return false;
  }
}

export async function verifyLocalAdminPassword(password: string): Promise<boolean> {
  const clean = password.trim();
  if (!clean) return false;
  const hash = await hashPassword(clean);
  const match = AUTHORIZED_HASHES.includes(hash);
  if (match) {
    const payload = JSON.stringify({ authenticated: true, at: Date.now() });
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, payload);
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, payload);
  }
  return match;
}

export function logoutLocalAdmin(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  } catch {
    // Ignoré
  }
}

