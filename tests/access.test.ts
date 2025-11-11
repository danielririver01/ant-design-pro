import access from '../src/access';

describe('access control', () => {
  beforeEach(() => {
    // Limpiar localStorage simulado
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    } as Storage;

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    window.localStorage.clear();
  });

  it('isAuthenticated true si hay currentUser', () => {
    const perms = access({ currentUser: { userid: '1', access: 'admin' } });
    expect(perms.isAuthenticated).toBe(true);
    expect(perms.canAdmin).toBe(true);
  });

  it('isAuthenticated true si hay access_token en localStorage', () => {
    window.localStorage.setItem('access_token', 'abc123');
    const perms = access({});
    expect(perms.isAuthenticated).toBe(true);
    expect(perms.canAdmin).toBe(false);
  });

  it('isAuthenticated false si no hay usuario ni token', () => {
    const perms = access({});
    expect(perms.isAuthenticated).toBe(false);
  });
});