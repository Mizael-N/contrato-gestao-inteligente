
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';

export interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const { showNotification } = useNotifications();

  const uploadFile = async (file: File, folder: string = ''): Promise<UploadedFile | null> => {
    try {
      setUploading(true);
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      console.log('📤 Fazendo upload do arquivo:', file.name, 'para:', filePath);

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('contract-documents')
        .upload(filePath, file);

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      console.log('✅ Upload realizado com sucesso:', data);

      // Obter URL pública (mesmo que o bucket seja privado, isso nos dá o path)
      const { data: urlData } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(filePath);

      return {
        id: crypto.randomUUID(),
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      showNotification('Erro', 'Falha ao fazer upload do arquivo.', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deletando arquivo:', filePath);
      
      const { error } = await supabase.storage
        .from('contract-documents')
        .remove([filePath]);

      if (error) {
        console.error('❌ Erro ao deletar arquivo:', error);
        throw error;
      }

      console.log('✅ Arquivo deletado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      showNotification('Erro', 'Falha ao deletar arquivo.', 'error');
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading
  };
}
