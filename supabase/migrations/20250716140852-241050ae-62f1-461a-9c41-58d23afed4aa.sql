-- Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Remover a função existente que causa problemas
DROP FUNCTION IF EXISTS public.is_admin(user_id UUID) CASCADE;

-- Criar nova função SECURITY DEFINER para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar nova política para admins usando a função SECURITY DEFINER
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR ALL USING (public.is_admin());

-- Criar função para limpar todos os dados do sistema (para admins)
CREATE OR REPLACE FUNCTION public.clear_all_system_data()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Verificar se o usuário atual é admin
  current_user_id := auth.uid();
  
  IF NOT public.is_admin(current_user_id) THEN
    RAISE EXCEPTION 'Access denied: Only admins can clear system data';
  END IF;

  -- Deletar dados em ordem de dependências (FK constraints)
  DELETE FROM public.documents;
  DELETE FROM public.payments;
  DELETE FROM public.addendums;
  DELETE FROM public.contracts;
  DELETE FROM public.suppliers;
  
  -- Não deletar profiles para manter os usuários
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error clearing system data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;