
-- Remove the data_assinatura column from contracts table since we're using data_inicio instead
ALTER TABLE public.contracts DROP COLUMN IF EXISTS data_assinatura;
