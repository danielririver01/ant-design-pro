// Función para refrescar el access token usando cookie HttpOnly y CSRF double-submit
import { setAccessToken } from './tokenMemory';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function refreshAccessToken(): Promise<boolean> {
  const csrf = getCookie('csrf_refresh');
  if (!csrf) return false;
  // Usar siempre el prefijo /api para que funcione en dev y prod
  const url = `/api/auth/refresh`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrf,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    const token = data?.access_token || data?.data?.access_token;
    if (token) {
      setAccessToken(token);
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}
