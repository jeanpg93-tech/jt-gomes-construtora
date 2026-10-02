import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';
import { dataClient } from '@/api/dataClient';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState(null);
  const checkAppState = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) { setUser(null); setAuthError(null); return; }
      const profile = await dataClient.auth.me();
      setUser(profile);
      setAuthError(profile.active ? null : { type: 'pending_approval', message: 'Seu acesso aguarda aprovação do administrador.' });
    } catch (error) {
      setUser(null);
      setAuthError({ type: 'connection_error', message: error.message });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    checkAppState();
    if (!supabase) return;
    // Supabase calls run outside the callback to avoid deadlocking its auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(checkAppState, 0); });
    return () => subscription.unsubscribe();
  }, [checkAppState]);
  return <AuthContext.Provider value={{
    user, isAuthenticated: Boolean(user?.active), isLoadingAuth: loading,
    isLoadingPublicSettings: false, isConfigured: isSupabaseConfigured, authError,
    checkAppState, logout: dataClient.auth.logout, navigateToLogin: dataClient.auth.redirectToLogin,
  }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
