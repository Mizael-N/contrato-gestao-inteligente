
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ContractDocumentsProps {
  contract: Contract;
}

export default function ContractDocuments({ contract }: ContractDocumentsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
      </CardHeader>
      <CardContent>
        {contract.documentos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum documento anexado</p>
        ) : (
          <div className="space-y-2">
            {contract.documentos.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{doc.nome}</h4>
                  <p className="text-sm text-gray-600">Tipo: {doc.tipo}</p>
                  <p className="text-sm text-gray-500">Enviado em: {formatDate(doc.dataUpload)}</p>
                </div>
                <Button variant="outline" size="sm">
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
