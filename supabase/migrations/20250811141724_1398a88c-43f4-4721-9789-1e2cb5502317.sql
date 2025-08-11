
-- Criar bucket de storage para documentos de contratos
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', false);

-- Política para permitir upload de documentos (usuários autenticados)
CREATE POLICY "Allow authenticated users to upload contract documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'contract-documents' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir visualização de documentos (usuários autenticados)
CREATE POLICY "Allow authenticated users to view contract documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'contract-documents' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir atualização de documentos (usuários autenticados)
CREATE POLICY "Allow authenticated users to update contract documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'contract-documents' AND 
  auth.role() = 'authenticated'
);

-- Política para permitir exclusão de documentos (usuários autenticados)
CREATE POLICY "Allow authenticated users to delete contract documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'contract-documents' AND 
  auth.role() = 'authenticated'
);

-- Adicionar colunas para arquivos na tabela documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS file_type text;

-- Adicionar tabela para arquivos de aditivos
CREATE TABLE IF NOT EXISTS public.addendum_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  addendum_id uuid NOT NULL,
  nome text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  data_upload timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela addendum_documents
ALTER TABLE public.addendum_documents ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações em addendum_documents
CREATE POLICY "Allow all operations on addendum_documents" 
ON public.addendum_documents 
FOR ALL 
USING (true) 
WITH CHECK (true);
