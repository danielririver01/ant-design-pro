// Gestión de access token en memoria (no persistente)
let accessTokenMemory: string | null = null;

export function setAccessToken(token: string | null): void {
  accessTokenMemory = token || null;
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function clearAccessToken(): void {
  accessTokenMemory = null;
}

// Rehidratar el token en memoria desde localStorage (compatibilidad)
export function rehydrateAccessTokenFromStorage(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (stored) {
      accessTokenMemory = stored;
    }
  } catch (_) {
    // Silenciar errores de acceso a localStorage
  }
}
