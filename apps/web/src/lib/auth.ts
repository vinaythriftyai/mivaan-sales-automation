import type { AuthUser } from "@/types";

export function saveAuth(accessToken: string, user: AuthUser) {
  localStorage.setItem("mivaan_access_token", accessToken);
  localStorage.setItem("mivaan_user", JSON.stringify(user));
}
export function getAccessToken() { return typeof window === "undefined" ? null : localStorage.getItem("mivaan_access_token"); }
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem("mivaan_user");
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { return null; }
}
export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mivaan_access_token");
  localStorage.removeItem("mivaan_user");
}
