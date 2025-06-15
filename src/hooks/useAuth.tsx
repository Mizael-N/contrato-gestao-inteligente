import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  isAdmin: false,
});

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

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('🔍 fetchProfile - Starting for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        
        // Se não encontrar o perfil, criar um perfil básico
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profile not found, creating basic profile');
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              email: user?.email || '',
              name: user?.user_metadata?.name || 'Usuário',
              role: 'user'
            }])
            .select()
            .single();

          if (createError) {
            console.error('❌ Erro ao criar perfil:', createError);
            return null;
          }

          console.log('✅ Profile created successfully:', newProfile);
          return newProfile as Profile;
        }
        return null;
      }

      const profileData: Profile = {
        ...data,
        role: (data.role === 'admin' || data.role === 'user') ? data.role : 'user'
      };

      console.log('✅ fetchProfile - Profile fetched successfully:', profileData);
      return profileData;
    } catch (error) {
      console.error('💥 Erro crítico ao buscar perfil:', error);
      return null;
    }
  };

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
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            if (mounted) {
              try {
                const userProfile = await fetchProfile(session.user.id);
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
            const userProfile = await fetchProfile(session.user.id);
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
    }, 3000); // Reduzido para 3 segundos

    initializeAuth();

    return () => {
      console.log('🧹 AuthProvider - Cleaning up auth listener');
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Remover 'loading' das dependências para evitar loops

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema!",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Cadastro realizado",
        description: "Conta criada com sucesso! Verifique seu email se necessário.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro no logout",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Até logo!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.role === 'admin';

  console.log('🎯 AuthProvider - Rendering with isAdmin:', isAdmin, 'loading:', loading);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
