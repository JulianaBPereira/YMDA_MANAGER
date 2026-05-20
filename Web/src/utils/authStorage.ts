export type Role = 'admin' | 'operador' | 'master';

export type AuthUser = {
  id: number | string;
  username: string;
  nome: string;
  role: Role;
};

export const USER_STORAGE_KEY = 'user';

function isAdminPanelRole(role: string): boolean {
  return role === 'admin' || role === 'master';
}

/** Lê usuário salvo (sessionStorage tem prioridade sobre localStorage). */
export function getStoredUser(): AuthUser | null {
  try {
    const raw =
      sessionStorage.getItem(USER_STORAGE_KEY) ??
      localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Admin/master: sessionStorage (some ao fechar o navegador).
 * Outros perfis: localStorage.
 */
export function persistUser(user: AuthUser): void {
  try {
    if (isAdminPanelRole(user.role)) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/** Remove sessão em todos os storages (logout). */
export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Remove resquícios de admin/master no localStorage após atualização. */
export function migrateAdminSessionFromLocalStorage(): void {
  try {
    const localRaw = localStorage.getItem(USER_STORAGE_KEY);
    if (!localRaw) return;

    const user = JSON.parse(localRaw) as AuthUser;
    if (!isAdminPanelRole(user.role)) return;

    if (!sessionStorage.getItem(USER_STORAGE_KEY)) {
      sessionStorage.setItem(USER_STORAGE_KEY, localRaw);
    }
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}
