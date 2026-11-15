export type WalletState = { balance: number | null; usedCodes: string[] };
const STORAGE_KEY = "veltrix.wallet.v1";
const SALT = "VELTRIX-AI-LOCAL-REDEMPTION-v1:";
const CODE_HASHES: Record<string, number | null> = {
  "28adf63ec1a189425232e075e80b3026860eee9de6a380695b49da021ab032a0": 50,
  "fd02e89f3fed23a86633e486b51c016e4c20765e19e7ed63df8e6e4afb99c7dc": 100,
  "a6c554de2e56e1d469730eec215f2dc11bd971f36a55f8df15f016e6e0a96f5a": 400,
  "d6ffed5926904bddbf950f0729fdc6881c235acd2388028ff3dba55e2d56615b": null
};
export const BUILD_COST = 10;
export const EMPTY_WALLET: WalletState = { balance: 0, usedCodes: [] };

export function readWallet(): WalletState {
  if (typeof window === "undefined") return EMPTY_WALLET;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Partial<WalletState> | null;
    if (!parsed || !(parsed.balance === null || (Number.isInteger(parsed.balance) && (parsed.balance as number) >= 0)) || !Array.isArray(parsed.usedCodes)) return EMPTY_WALLET;
    return { balance: parsed.balance as number | null, usedCodes: parsed.usedCodes.filter((item): item is string => typeof item === "string") };
  } catch { return EMPTY_WALLET; }
}
function writeWallet(wallet: WalletState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}
async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(SALT + code.trim());
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
export async function redeemWalletCode(rawCode: string): Promise<{ wallet: WalletState; message: string }> {
  const code = rawCode.trim();
  if (!code) return { wallet: readWallet(), message: "رمز را وارد کن." };
  if (!window.crypto?.subtle) return { wallet: readWallet(), message: "مرورگر این دستگاه از رمزنگاری امن پشتیبانی نمی‌کند." };
  const digest = await hashCode(code);
  const amount = CODE_HASHES[digest];
  if (amount === undefined) return { wallet: readWallet(), message: "رمز معتبر نیست." };
  const current = readWallet();
  if (current.usedCodes.includes(digest)) return { wallet: current, message: "این رمز قبلاً در این مرورگر استفاده شده است." };
  const next: WalletState = { balance: amount === null || current.balance === null ? null : current.balance + amount, usedCodes: [...current.usedCodes, digest] };
  writeWallet(next);
  return { wallet: next, message: amount === null ? "اعتبار نامحدود فعال شد." : amount + " توکن به کیف پول اضافه شد." };
}
export function deductTokens(wallet: WalletState, amount = BUILD_COST): WalletState | null {
  if (!Number.isInteger(amount) || amount < 0) return null;
  if (wallet.balance !== null && wallet.balance < amount) return null;
  return wallet.balance === null ? wallet : { ...wallet, balance: wallet.balance - amount };
}
export function consumeBuildTokens(wallet: WalletState, amount = BUILD_COST): WalletState | null {
  const next = deductTokens(wallet, amount);
  if (next) writeWallet(next);
  return next;
}
