
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Aditivo, Contract } from '@/types/contract';
import AddendumBasicInfoForm from './forms/AddendumBasicInfoForm';
import AddendumPrazoForm from './forms/AddendumPrazoForm';
import AddendumValorForm from './forms/AddendumValorForm';
import AddendumJustificativaForm from './forms/AddendumJustificativaForm';

interface AddendumFormProps {
  contract: Contract;
  onSubmit: (addendum: Omit<Aditivo, 'id'>) => void;
  onCancel: () => void;
}

export default function AddendumForm({ contract, onSubmit, onCancel }: AddendumFormProps) {
  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'prazo' as 'prazo' | 'valor' | 'qualitativo',
    justificativa: '',
    valorAnterior: contract.valor,
    valorNovo: contract.valor,
    prazoAnterior: contract.prazoExecucao,
    prazoNovo: contract.prazoExecucao,
    prazoUnidade: contract.prazoUnidade || 'dias' as 'dias' | 'meses' | 'anos',
    dataAssinatura: '',
  });

  const handleFormDataChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const addendum: Omit<Aditivo, 'id'> = {
      numero: formData.numero,
      tipo: formData.tipo,
      justificativa: formData.justificativa,
      dataAssinatura: formData.dataAssinatura,
    };

    if (formData.tipo === 'valor') {
      addendum.valorAnterior = formData.valorAnterior;
      addendum.valorNovo = formData.valorNovo;
    }

    if (formData.tipo === 'prazo') {
      addendum.prazoAnterior = formData.prazoAnterior;
      addendum.prazoNovo = formData.prazoNovo;
      addendum.prazoUnidade = formData.prazoUnidade;
    }

    onSubmit(addendum);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Novo Termo Aditivo - Contrato {contract.numero}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <AddendumBasicInfoForm
            formData={{
              numero: formData.numero,
              tipo: formData.tipo,
              dataAssinatura: formData.dataAssinatura,
            }}
            onFormDataChange={handleFormDataChange}
          />

          {formData.tipo === 'prazo' && (
            <AddendumPrazoForm
              formData={{
                prazoAnterior: formData.prazoAnterior,
                prazoNovo: formData.prazoNovo,
                prazoUnidade: formData.prazoUnidade,
              }}
              onFormDataChange={handleFormDataChange}
            />
          )}

          {formData.tipo === 'valor' && (
            <AddendumValorForm
              formData={{
                valorAnterior: formData.valorAnterior,
                valorNovo: formData.valorNovo,
              }}
              onFormDataChange={handleFormDataChange}
            />
          )}

          <AddendumJustificativaForm
            justificativa={formData.justificativa}
            onJustificativaChange={(justificativa) => handleFormDataChange({ justificativa })}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Termo Aditivo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
