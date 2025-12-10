import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User as AppUser } from '@/types';
import { supabase } from '@/lib/supabaseClient'; // adapt path if needed
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // fetch profile from 'profiles' table by auth user id
  const fetchProfile = useCallback(async (uid: string | null) => {
    if (!uid) {
      setUser(null);
      return;
    }

    try {
      // get email from auth session (profiles table doesn't store email)
      const session = await supabase.auth.getSession();
      const email = session.data.session?.user?.email ?? "";

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar, created_at')
        .eq('id', uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const userObj: AppUser = {
          id: data.id,
          name: data.full_name ?? "",
          email,                  // <-- now always a string
          avatar: data.avatar ?? null,
        };

        setUser(userObj);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('fetchProfile error', err);
      setUser(null);
    }
  }, []);


  // create profile row after sign up (or upsert)
  const createOrUpdateProfile = useCallback(async (uid: string, full_name: string, avatar?: string) => {
    const payload = {
      id: uid,
      full_name,
      avatar: avatar ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload); // v2-compliant

    if (error) throw error;
  }, []);


  // signUp -> supabase.auth.signUp + create profile
  const signUp = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name } // optional metadata
        }
      });

      if (error) throw error;

      // After signUp the user might need to confirm email - user object present if immediate session.
      const userId = data.user?.id ?? null;
      if (userId) {
        // Upsert profile row (our DB policies require auth.uid() = id for insert; when called client-side, auth.uid() is the logged in user)
        await createOrUpdateProfile(userId, name);
        await fetchProfile(userId);
      }

      toast({ title: 'Account created', description: 'Check your email to confirm (if required).' });
      return true;
    } catch (err: any) {
      console.error('signUp error', err);
      toast({ title: 'Signup failed', description: err.message ?? 'Unable to create account' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [createOrUpdateProfile, fetchProfile]);

  // signIn -> supabase.auth.signInWithPassword
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const uid = data.user?.id ?? null;
      await fetchProfile(uid);
      toast({ title: 'Signed in', description: 'Welcome back!' });
      return true;
    } catch (err: any) {
      console.error('signIn error', err);
      toast({ title: 'Sign in failed', description: err.message ?? 'Invalid credentials' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // signOut
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast({ title: 'Logged out', description: 'You have been signed out.' });
    } catch (err) {
      console.error('signOut error', err);
      toast({ title: 'Logout failed', description: 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // password reset
  const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password' // optional
      });
      if (error) throw error;
      toast({ title: 'Password Reset', description: 'Check your email for reset instructions.' });
      return true;
    } catch (err: any) {
      console.error('sendPasswordReset error', err);
      toast({ title: 'Reset failed', description: err.message ?? 'Unable to send reset email' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // manual refresh
  const refreshProfile = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const uid = session.data.session?.user?.id ?? null;
    await fetchProfile(uid);
  }, [fetchProfile]);

  // on mount: sync session & listen for auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (mounted) await fetchProfile(uid);
      setIsLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      fetchProfile(uid);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
