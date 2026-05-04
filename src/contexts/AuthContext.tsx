import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  localSuperAdminLogin: (remember: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      // Check for remembered Super Admin first (either persistent or session-based)
      const isLocalSuperAdmin = localStorage.getItem('localSuperAdmin') === 'true' || 
                               sessionStorage.getItem('localSuperAdmin') === 'true';
                               
      if (isLocalSuperAdmin) {
        if (mounted) {
          const fakeUser = { email: 'dtinv1898@gmail.com', id: 'super-admin-bypass' } as User;
          setUser(fakeUser);
          setSession({ user: fakeUser } as Session);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Ignore Supabase auth state changes if we are locally logged in as super admin
      const isLocalSuperAdmin = localStorage.getItem('localSuperAdmin') === 'true' || 
                               sessionStorage.getItem('localSuperAdmin') === 'true';
      if (isLocalSuperAdmin) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const isLocalSuperAdmin = localStorage.getItem('localSuperAdmin') === 'true' || 
                             sessionStorage.getItem('localSuperAdmin') === 'true';
                             
    if (isLocalSuperAdmin) {
      localStorage.removeItem('localSuperAdmin');
      sessionStorage.removeItem('localSuperAdmin');
      setUser(null);
      setSession(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  const localSuperAdminLogin = (remember: boolean = false) => {
    if (remember) {
      localStorage.setItem('localSuperAdmin', 'true');
    } else {
      sessionStorage.setItem('localSuperAdmin', 'true');
    }
    const fakeUser = { email: 'dtinv1898@gmail.com', id: 'super-admin-bypass' } as User;
    setUser(fakeUser);
    setSession({ user: fakeUser } as Session);
  };

  const isSuperAdmin = user?.email === 'dtinv1898@gmail.com';

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isSuperAdmin, signOut, localSuperAdminLogin }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
