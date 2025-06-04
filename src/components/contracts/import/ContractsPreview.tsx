
import { CheckCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Contract } from '@/types/contract';

interface ContractsPreviewProps {
  preview: Partial<Contract>[];
  fileType: 'spreadsheet' | 'document' | 'image' | null;
  processing: boolean;
  importing: boolean;
  onImport: () => void;
}

export default function ContractsPreview({ preview, fileType, processing, importing, onImport }: ContractsPreviewProps) {
  if (preview.length === 0 || processing || importing) return null;

  return (
    <div>
      <div className="flex items-center mb-3">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <h3 className="font-medium">✅ {preview.length} contrato(s) processado(s) com sucesso</h3>
      </div>
      
      <div className="max-h-96 overflow-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="p-3 text-left font-medium">Número</th>
              <th className="p-3 text-left font-medium">Objeto</th>
              <th className="p-3 text-left font-medium">Contratada</th>
              <th className="p-3 text-left font-medium">Valor</th>
              <th className="p-3 text-left font-medium">Prazo</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Origem</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((contract, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-xs" title={contract.numero}>
                  {contract.numero?.substring(0, 15)}...
                </td>
                <td className="p-3" title={contract.objeto}>
                  {contract.objeto?.substring(0, 40)}...
                </td>
                <td className="p-3" title={contract.contratada}>
                  {contract.contratada?.substring(0, 25)}...
                </td>
                <td className="p-3 font-medium text-green-600">
                  R$ {contract.valor?.toLocaleString('pt-BR')}
                </td>
                <td className="p-3">
                  {contract.prazoExecucao} {contract.prazoUnidade}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    contract.status === 'vigente' ? 'bg-green-100 text-green-800' : 
                    contract.status === 'encerrado' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contract.status}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    fileType === 'document' ? 'bg-blue-100 text-blue-800' :
                    fileType === 'image' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {fileType === 'document' ? 'OCR Doc' :
                     fileType === 'image' ? 'OCR Img' : 'Planilha'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 font-medium mb-1">
            ✅ Processamento {fileType === 'spreadsheet' ? 'de planilha' : 'com OCR'} concluído:
          </p>
          <ul className="text-xs text-green-600 space-y-1">
            {fileType !== 'spreadsheet' ? (
              <>
                <li>• Texto extraído com reconhecimento ótico</li>
                <li>• Campos de contrato identificados automaticamente</li>
                <li>• Dados normalizados e estruturados</li>
                <li>• Informações validadas e corrigidas</li>
              </>
            ) : (
              <>
                <li>• Datas convertidas para formato padrão ISO</li>
                <li>• Valores monetários limpos e convertidos</li>
                <li>• Textos normalizados (quebras de linha removidas)</li>
                <li>• TAs extraídos com prazos e status identificados</li>
              </>
            )}
          </ul>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium mb-1">
            ⚠️ Revisão recomendada:
          </p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Verificar precisão dos valores extraídos</li>
            <li>• Confirmar datas e prazos identificados</li>
            <li>• Revisar nomes de empresas e objetos</li>
            <li>• Ajustar campos não identificados automaticamente</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={onImport} className="bg-green-600 hover:bg-green-700">
          <Upload className="h-4 w-4 mr-2" />
          Importar {preview.length} contrato(s)
        </Button>
      </div>
    </div>
  );
}
