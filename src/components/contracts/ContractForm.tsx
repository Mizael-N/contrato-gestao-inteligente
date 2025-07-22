
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract } from '@/types/contract';
import BasicInfoForm from './forms/BasicInfoForm';
import FiscalInfoForm from './forms/FiscalInfoForm';
import GuaranteeInfoForm from './forms/GuaranteeInfoForm';
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
    dataAssinatura: contract?.dataAssinatura || '',
    dataInicio: contract?.dataInicio || '',
    dataTermino: contract?.dataTermino || '',
    prazoExecucao: contract?.prazoExecucao || 365,
    prazoUnidade: contract?.prazoUnidade || 'dias',
    modalidade: contract?.modalidade || 'pregao',
    status: contract?.status || 'vigente',
    observacoes: contract?.observacoes || '',
    fiscalTitular: contract?.fiscais?.titular || '',
    fiscalSubstituto: contract?.fiscais?.substituto || '',
    garantiaTipo: contract?.garantia?.tipo || 'sem_garantia',
    garantiaValor: contract?.garantia?.valor || 0,
    garantiaVencimento: contract?.garantia?.dataVencimento || '',
    // Campos de aditivo para edição
    tipoAditivo: '',
    dataAditivo: '',
    justificativaAditivo: '',
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      fiscais: {
        titular: formData.fiscalTitular,
        substituto: formData.fiscalSubstituto,
      },
      garantia: {
        tipo: formData.garantiaTipo as any,
        valor: formData.garantiaValor,
        dataVencimento: formData.garantiaVencimento,
      },
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
          
          <FiscalInfoForm 
            formData={formData} 
            onChange={handleFieldChange} 
          />
          
          <GuaranteeInfoForm 
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
