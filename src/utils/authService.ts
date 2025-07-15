import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState } from './authCleanup';

export const createAuthService = (toast: ReturnType<typeof useToast>['toast']) => {
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 authService - Iniciando login para:', email);
      
      // Limpar estado anterior antes do login
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ authService - Erro no login:', error);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      console.log('✅ authService - Login realizado com sucesso');
      
      // Verificar se o usuário é admin para mostrar mensagem personalizada
      const isAdminUser = email === 'mizaelneto20@gmail.com';
      
      if (isAdminUser) {
        toast({
          title: "Login de Administrador",
          description: "Bem-vindo ao painel administrativo! Você tem acesso completo ao sistema.",
        });
      } else {
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema!",
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('💥 authService - Erro crítico no login:', error);
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
      console.log('📝 authService - Iniciando cadastro para:', email);
      
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
        console.error('❌ authService - Erro no cadastro:', error);
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      console.log('✅ authService - Cadastro realizado com sucesso');
      toast({
        title: "Cadastro realizado",
        description: "Conta criada com sucesso! Verifique seu email se necessário.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('💥 authService - Erro crítico no cadastro:', error);
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
      console.log('🚪 authService - Iniciando logout');
      
      // Limpar estado de autenticação primeiro
      cleanupAuthState();
      
      // Tentar fazer logout no Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('❌ authService - Erro no logout:', error);
        toast({
          title: "Aviso",
          description: "Você foi desconectado do sistema.",
          variant: "default",
        });
      } else {
        console.log('✅ authService - Logout realizado com sucesso');
        toast({
          title: "Logout realizado",
          description: "Até logo!",
        });
      }
      
      // Sempre redirecionar para a tela de login, independentemente do erro
      window.location.href = '/auth';
      
    } catch (error: any) {
      console.error('💥 authService - Erro crítico no logout:', error);
      toast({
        title: "Aviso",
        description: "Você foi desconectado do sistema.",
        variant: "default",
      });
      
      // Mesmo com erro, redirecionar para login
      window.location.href = '/auth';
    }
  };

  return { signIn, signUp, signOut };
};
