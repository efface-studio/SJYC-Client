export const loginSurface = (): 'user' | 'admin' =>
  typeof window !== 'undefined' && /^\/admin(?:\/|$)/.test(window.location.pathname) ? 'admin' : 'user';
