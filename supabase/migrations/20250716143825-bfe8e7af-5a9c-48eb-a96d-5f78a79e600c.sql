-- Corrigir a função clear_all_system_data para usar WHERE clauses específicas
-- Isso resolve o erro "DELETE requires a WHERE clause"
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

  -- Deletar dados em ordem de dependências com WHERE clauses específicas
  DELETE FROM public.documents WHERE id IS NOT NULL;
  DELETE FROM public.payments WHERE id IS NOT NULL;
  DELETE FROM public.addendums WHERE id IS NOT NULL;
  DELETE FROM public.contracts WHERE id IS NOT NULL;
  DELETE FROM public.suppliers WHERE id IS NOT NULL;
  
  -- Não deletar profiles para manter os usuários
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error clearing system data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;