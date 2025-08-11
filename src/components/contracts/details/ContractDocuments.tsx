
import { useState } from 'react';
import { Contract, Documento } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import FileUpload from '../forms/FileUpload';
import { UploadedFile } from '@/hooks/useFileUpload';

interface ContractDocumentsProps {
  contract: Contract;
  onDocumentsUpdate?: (documents: Documento[]) => void;
  editable?: boolean;
}

export default function ContractDocuments({ 
  contract, 
  onDocumentsUpdate,
  editable = false 
}: ContractDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    
    if (onDocumentsUpdate) {
      // Converter UploadedFile para Documento
      const newDocuments: Documento[] = files.map(file => ({
        id: file.id,
        nome: file.name,
        tipo: file.type,
        dataUpload: new Date().toISOString(),
        url: file.url
      }));
      
      // Combinar com documentos existentes
      const allDocuments = [...contract.documentos, ...newDocuments];
      onDocumentsUpdate(allDocuments);
    }
  };

  const downloadFile = async (doc: Documento) => {
    try {
      // Para arquivos armazenados no Supabase Storage
      if (doc.url.includes('supabase')) {
        window.open(doc.url, '_blank');
      } else {
        // Para outros tipos de URL
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.nome;
        link.click();
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Documentos
          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploading(!isUploading)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable && isUploading && (
          <FileUpload
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            folder={`contracts/${contract.id}/documents`}
            label="Adicionar Documentos"
          />
        )}

        {contract.documentos.length === 0 && uploadedFiles.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum documento anexado</p>
        ) : (
          <div className="space-y-2">
            {/* Documentos existentes */}
            {contract.documentos.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{doc.nome}</h4>
                  <p className="text-sm text-gray-600">Tipo: {doc.tipo}</p>
                  <p className="text-sm text-gray-500">Enviado em: {formatDate(doc.dataUpload)}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadFile(doc)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>
            ))}

            {/* Novos arquivos uploadeados */}
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 flex items-center justify-between bg-green-50">
                <div>
                  <h4 className="font-medium">{file.name}</h4>
                  <p className="text-sm text-gray-600">Tipo: {file.type}</p>
                  <p className="text-sm text-green-600">Novo arquivo</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
