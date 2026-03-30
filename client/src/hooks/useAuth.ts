import { useMemo } from "react";

export const AUTH_USER_KEY = "ram-sita:user";

export interface AuthUser {
  name: string;
}

export function readAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (typeof parsed.name !== "string" || !parsed.name.trim()) return null;
    return { name: parsed.name.trim() };
  } catch {
    return null;
  }
}

export function writeAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ name: user.name.trim() }));
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function useAuthUser() {
  return useMemo(() => readAuthUser(), []);
}
