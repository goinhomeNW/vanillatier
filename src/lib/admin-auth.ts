const KEY = "mcranks.admin.session";

export const ADMIN_USER = "MCranksAdmin";
export const ADMIN_PASS = "0o9i8u7y6t5r4e3w2q";

export function login(user: string, pass: string): boolean {
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(KEY);
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}
