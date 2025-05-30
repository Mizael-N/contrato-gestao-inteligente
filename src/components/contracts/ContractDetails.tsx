
import { Contract } from '@/types/contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, User, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContractDetailsProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onBack: () => void;
}

export default function ContractDetails({ contract, onEdit, onBack }: ContractDetailsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      vigente: { label: 'Vigente', variant: 'default' as const },
      suspenso: { label: 'Suspenso', variant: 'secondary' as const },
      encerrado: { label: 'Encerrado', variant: 'outline' as const },
      rescindido: { label: 'Rescindido', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contrato {contract.numero}</h1>
            {getStatusBadge(contract.status)}
          </div>
        </div>
        <Button onClick={() => onEdit(contract)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="fiscalizacao">Fiscalização</TabsTrigger>
          <TabsTrigger value="aditivos">Aditivos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Número</label>
                  <p className="text-sm">{contract.numero}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modalidade</label>
                  <p className="text-sm capitalize">{contract.modalidade.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Objeto</label>
                  <p className="text-sm">{contract.objeto}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(contract.status)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Prazos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Assinatura</label>
                  <p className="text-sm">{formatDate(contract.dataAssinatura)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prazo de Execução</label>
                  <p className="text-sm">{contract.prazoExecucao} dias</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Vencimento</label>
                  <p className="text-sm">
                    {formatDate(
                      new Date(
                        new Date(contract.dataAssinatura).getTime() + 
                        contract.prazoExecucao * 24 * 60 * 60 * 1000
                      ).toISOString().split('T')[0]
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Partes Contratantes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contratante</label>
                <p className="text-sm">{contract.contratante}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contratada</label>
                <p className="text-sm">{contract.contratada}</p>
              </div>
            </CardContent>
          </Card>

          {contract.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{contract.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor do Contrato</label>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(contract.valor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor da Garantia</label>
                  <p className="text-lg font-semibold">{formatCurrency(contract.garantia.valor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Garantia</label>
                  <p className="text-sm capitalize">{contract.garantia.tipo.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscalizacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Fiscalização do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fiscal Titular</label>
                <p className="text-sm">{contract.fiscais.titular}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fiscal Substituto</label>
                <p className="text-sm">{contract.fiscais.substituto}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aditivos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Termos Aditivos</CardTitle>
            </CardHeader>
            <CardContent>
              {contract.aditivos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum termo aditivo cadastrado</p>
              ) : (
                <div className="space-y-2">
                  {contract.aditivos.map((aditivo) => (
                    <div key={aditivo.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{aditivo.numero}</h4>
                          <p className="text-sm text-gray-600">{aditivo.justificativa}</p>
                        </div>
                        <Badge variant="outline">{aditivo.tipo}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
