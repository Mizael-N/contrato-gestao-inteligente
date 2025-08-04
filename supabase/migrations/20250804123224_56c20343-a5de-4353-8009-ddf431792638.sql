
-- Adicionar campos de vigência na tabela contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_termino DATE;

-- Atualizar contratos existentes: definir data_inicio como data_assinatura quando não preenchida
UPDATE public.contracts 
SET data_inicio = data_assinatura 
WHERE data_inicio IS NULL;

-- Atualizar contratos existentes: calcular data_termino baseado em 1 ano quando não preenchida
UPDATE public.contracts 
SET data_termino = data_assinatura + INTERVAL '1 year'
WHERE data_termino IS NULL;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.contracts.data_inicio IS 'Data de início da vigência do contrato';
COMMENT ON COLUMN public.contracts.data_termino IS 'Data de término da vigência do contrato';
