
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract } from '@/types/contract';
import BasicInfoForm from './forms/BasicInfoForm';
import AddendumInfoForm from './forms/AddendumInfoForm';

interface ContractFormProps {
  contract?: Contract;
  onSubmit: (contract: Partial<Contract>) => void;
  onCancel: () => void;
}

export default function ContractForm({ contract, onSubmit, onCancel }: ContractFormProps) {
  const [formData, setFormData] = useState({
    numero: contract?.numero || '',
    objeto: contract?.objeto || '',
    contratante: contract?.contratante || '',
    contratada: contract?.contratada || '',
    valor: contract?.valor || 0,
    dataInicio: contract?.dataInicio || '',
    dataTermino: contract?.dataTermino || '',
    prazoExecucao: contract?.prazoExecucao || 365,
    prazoUnidade: contract?.prazoUnidade || 'dias',
    modalidade: contract?.modalidade || 'pregao',
    status: contract?.status || 'vigente',
    observacoes: contract?.observacoes || '',
    // Campos de aditivo para edição
    tipoAditivo: '',
    dataAditivo: '',
    justificativaAditivo: '',
  });

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    
    // Se mudou data de início ou prazo, calcular data de término automaticamente se não existir
    if ((field === 'dataInicio' || field === 'prazoExecucao' || field === 'prazoUnidade') && 
        newData.dataInicio && !contract?.dataTermino) {
      const inicioDate = new Date(newData.dataInicio);
      const terminoDate = new Date(inicioDate);
      
      const prazoUnidade = newData.prazoUnidade;
      const prazoExecucao = newData.prazoExecucao;
      
      switch (prazoUnidade) {
        case 'meses':
          terminoDate.setMonth(terminoDate.getMonth() + prazoExecucao);
          break;
        case 'anos':
          terminoDate.setFullYear(terminoDate.getFullYear() + prazoExecucao);
          break;
        default: // dias
          terminoDate.setDate(terminoDate.getDate() + prazoExecucao);
      }
      
      newData.dataTermino = terminoDate.toISOString().split('T')[0];
    }
    
    setFormData(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular dataTermino se não definida (1 ano por padrão)
    const finalData = { ...formData };
    if (!finalData.dataTermino && finalData.dataInicio) {
      const inicioDate = new Date(finalData.dataInicio);
      const terminoDate = new Date(inicioDate);
      terminoDate.setFullYear(terminoDate.getFullYear() + 1);
      finalData.dataTermino = terminoDate.toISOString().split('T')[0];
    }
    
    onSubmit({
      ...finalData,
      aditivos: contract?.aditivos || [],
      pagamentos: contract?.pagamentos || [],
      documentos: contract?.documentos || [],
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{contract ? 'Editar Contrato' : 'Novo Contrato'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoForm 
            formData={formData} 
            onChange={handleFieldChange} 
          />

          {contract && (
            <AddendumInfoForm
              formData={formData}
              onChange={handleFieldChange}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {contract ? 'Atualizar' : 'Criar'} Contrato
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
