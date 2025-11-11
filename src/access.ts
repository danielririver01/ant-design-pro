/**
 * Control de acceso basado en initialState y token en localStorage.
 * Umi/Ant Design Pro espera que exportemos una función por defecto
 * que retorna un objeto con banderas de acceso.
 */

export default function access(initialState: any) {
  const currentUser = initialState?.currentUser;
  const tokenKey = 'access_token';
  const legacyTokenKey = 'token';
  const hasToken =
    typeof localStorage !== 'undefined' &&
    (!!localStorage.getItem(tokenKey) || !!localStorage.getItem(legacyTokenKey));

  const isAuthenticated = !!currentUser?.userid || hasToken;
  const canAdmin = (currentUser?.access || '').toLowerCase() === 'admin';

  return {
    isAuthenticated,
    canAdmin,
  };
}
