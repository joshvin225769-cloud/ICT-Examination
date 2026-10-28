import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() {
    setLoading(true); setError('');
    try { setUser((await api('/auth/me')).data); }
    catch (err) { setUser(null); if (err.status !== 401) setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    refresh();
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  async function signIn(mode, values) {
    const result = await api(`/auth/${mode}`, { method: 'POST', body: values });
    setUser(result.data);
  }
  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, loading, error, refresh, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
