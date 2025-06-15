
import { useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile, AuthContextType } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContext';
import { fetchProfile } from '@/utils/profileService';
import { createAuthService } from '@/utils/authService';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  console.log('🔧 AuthProvider - Current state:', { 
    user: !!user, 
    profile: !!profile, 
    session: !!session, 
    loading,
    timestamp: new Date().toISOString()
  });

  const authService = createAuthService(toast);

  useEffect(() => {
    console.log('🚀 AuthProvider - Setting up auth listener');
    
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, 'Session exists:', !!session);
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, ignoring auth change');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 Auth state change - Fetching profile for user:', session.user.id);
          setTimeout(async () => {
            if (mounted) {
              try {
                const userProfile = await fetchProfile(session.user.id, session.user);
                if (mounted) {
                  setProfile(userProfile);
                  setLoading(false);
                }
              } catch (error) {
                console.error('💥 Error fetching profile in auth state change:', error);
                if (mounted) {
                  setProfile(null);
                  setLoading(false);
                }
              }
            }
          }, 0);
        } else {
          console.log('🚫 No user in session, clearing profile');
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    console.log('🔍 AuthProvider - Checking for existing session');
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('📋 Initial session check - Session exists:', !!session);
        
        if (!mounted) {
          console.log('⚠️ Component unmounted during session check');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 Initial session - Fetching profile for user:', session.user.id);
          try {
            const userProfile = await fetchProfile(session.user.id, session.user);
            if (mounted) {
              setProfile(userProfile);
            }
          } catch (error) {
            console.error('💥 Error fetching profile in initial check:', error);
            if (mounted) {
              setProfile(null);
            }
          }
        }

        if (mounted) {
          setLoading(false);
          console.log('✅ Initial session check - Loading set to false');
        }
      } catch (error) {
        console.error('💥 Critical error in auth initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Timeout para garantir que o loading não fique preso
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ Auth initialization timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000);

    initializeAuth();

    return () => {
      console.log('🧹 AuthProvider - Cleaning up auth listener');
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

  console.log('🎯 AuthProvider - Rendering with isAdmin:', isAdmin, 'loading:', loading);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn: authService.signIn,
        signUp: authService.signUp,
        signOut: authService.signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
