
import { useState } from 'react';
import { Contract, Aditivo } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Calendar } from 'lucide-react';
import FileUpload from '../forms/FileUpload';
import { UploadedFile } from '@/hooks/useFileUpload';

interface ContractAddendumsProps {
  contract: Contract;
  onAddendumsUpdate?: (addendums: Aditivo[]) => void;
  editable?: boolean;
}

export default function ContractAddendums({ 
  contract, 
  onAddendumsUpdate,
  editable = false 
}: ContractAddendumsProps) {
  const [expandedAddendum, setExpandedAddendum] = useState<string | null>(null);
  const [uploadingForAddendum, setUploadingForAddendum] = useState<string | null>(null);
  const [addendumFiles, setAddendumFiles] = useState<Record<string, UploadedFile[]>>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddendumFilesChange = (addendumId: string, files: UploadedFile[]) => {
    setAddendumFiles(prev => ({
      ...prev,
      [addendumId]: files
    }));

    if (onAddendumsUpdate) {
      // Aqui você pode implementar a lógica para salvar os arquivos do aditivo
      // Por enquanto, vamos apenas atualizar o estado local
      console.log('📄 Arquivos do aditivo', addendumId, ':', files);
    }
  };

  const toggleAddendumExpansion = (addendumId: string) => {
    setExpandedAddendum(expandedAddendum === addendumId ? null : addendumId);
  };

  const renderAddendumValue = (aditivo: Aditivo) => {
    if (aditivo.tipo === 'valor' && aditivo.valorAnterior && aditivo.valorNovo) {
      return (
        <div className="text-sm text-gray-600">
          <p>Valor anterior: {formatCurrency(aditivo.valorAnterior)}</p>
          <p>Valor novo: {formatCurrency(aditivo.valorNovo)}</p>
        </div>
      );
    }
    
    if (aditivo.tipo === 'prazo' && aditivo.prazoAnterior && aditivo.prazoNovo) {
      return (
        <div className="text-sm text-gray-600">
          <p>Prazo anterior: {aditivo.prazoAnterior} {aditivo.prazoUnidade || 'dias'}</p>
          <p>Prazo novo: {aditivo.prazoNovo} {aditivo.prazoUnidade || 'dias'}</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Termos Aditivos</CardTitle>
      </CardHeader>
      <CardContent>
        {contract.aditivos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum termo aditivo cadastrado</p>
        ) : (
          <div className="space-y-4">
            {contract.aditivos.map((aditivo) => (
              <Card key={aditivo.id} className="border">
                <CardContent className="p-4">
                  <div 
                    className="flex justify-between items-start cursor-pointer"
                    onClick={() => toggleAddendumExpansion(aditivo.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{aditivo.numero}</h4>
                        <Badge variant="outline">{aditivo.tipo}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{aditivo.justificativa}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Assinado em: {formatDate(aditivo.dataAssinatura)}
                      </div>
                    </div>
                    {editable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadingForAddendum(
                            uploadingForAddendum === aditivo.id ? null : aditivo.id
                          );
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Documentos
                      </Button>
                    )}
                  </div>

                  {expandedAddendum === aditivo.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {renderAddendumValue(aditivo)}
                      
                      {/* Upload de documentos para o aditivo */}
                      {editable && uploadingForAddendum === aditivo.id && (
                        <FileUpload
                          files={addendumFiles[aditivo.id] || []}
                          onFilesChange={(files) => handleAddendumFilesChange(aditivo.id, files)}
                          folder={`contracts/${contract.id}/addendums/${aditivo.id}`}
                          label="Documentos do Aditivo"
                          maxFiles={3}
                        />
                      )}

                      {/* Documentos existentes do aditivo */}
                      {aditivo.documentos && aditivo.documentos.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Documentos Anexados</h5>
                          <div className="space-y-2">
                            {aditivo.documentos.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="text-sm font-medium">{doc.nome}</p>
                                  <p className="text-xs text-gray-500">{doc.tipo}</p>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Novos arquivos uploadeados */}
                      {addendumFiles[aditivo.id] && addendumFiles[aditivo.id].length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Novos Documentos</h5>
                          <div className="space-y-2">
                            {addendumFiles[aditivo.id].map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-green-600">Novo arquivo</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
