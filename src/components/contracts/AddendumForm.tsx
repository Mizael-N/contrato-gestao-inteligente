
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Aditivo, Contract } from '@/types/contract';

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

  const getAdditiveTypeOptions = () => {
    const options = [
      { value: 'prazo', label: 'Prorrogação de Prazo' },
      { value: 'valor', label: 'Acréscimo/Supressão de Valor' },
      { value: 'qualitativo', label: 'Alteração Qualitativa' },
    ];
    
    console.log('Additive type options:', options);
    return options;
  };

  const getPrazoUnidadeOptions = () => [
    { value: 'dias', label: 'Dias' },
    { value: 'meses', label: 'Meses' },
    { value: 'anos', label: 'Anos' },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Novo Termo Aditivo - Contrato {contract.numero}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número do Termo Aditivo</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Ex: 001/2024"
                required
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo do Termo Aditivo</Label>
              <Select value={formData.tipo} onValueChange={(value: 'prazo' | 'valor' | 'qualitativo') => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {getAdditiveTypeOptions().map(option => {
                    console.log('Rendering SelectItem with value:', option.value);
                    if (!option.value || option.value.trim() === '') {
                      console.error('Empty value detected for option:', option);
                      return null;
                    }
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="dataAssinatura">Data de Assinatura</Label>
            <Input
              id="dataAssinatura"
              type="date"
              value={formData.dataAssinatura}
              onChange={(e) => setFormData({ ...formData, dataAssinatura: e.target.value })}
              required
            />
          </div>

          {formData.tipo === 'prazo' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="prazoUnidade">Unidade de Prazo</Label>
                <Select value={formData.prazoUnidade} onValueChange={(value: 'dias' | 'meses' | 'anos') => setFormData({ ...formData, prazoUnidade: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPrazoUnidadeOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prazoAnterior">Prazo Anterior ({formData.prazoUnidade})</Label>
                  <Input
                    id="prazoAnterior"
                    type="number"
                    value={formData.prazoAnterior}
                    onChange={(e) => setFormData({ ...formData, prazoAnterior: parseInt(e.target.value) })}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="prazoNovo">Novo Prazo ({formData.prazoUnidade})</Label>
                  <Input
                    id="prazoNovo"
                    type="number"
                    value={formData.prazoNovo}
                    onChange={(e) => setFormData({ ...formData, prazoNovo: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {formData.tipo === 'valor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valorAnterior">Valor Anterior (R$)</Label>
                <Input
                  id="valorAnterior"
                  type="number"
                  step="0.01"
                  value={formData.valorAnterior}
                  onChange={(e) => setFormData({ ...formData, valorAnterior: parseFloat(e.target.value) })}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="valorNovo">Novo Valor (R$)</Label>
                <Input
                  id="valorNovo"
                  type="number"
                  step="0.01"
                  value={formData.valorNovo}
                  onChange={(e) => setFormData({ ...formData, valorNovo: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="justificativa">Justificativa</Label>
            <Textarea
              id="justificativa"
              value={formData.justificativa}
              onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
              placeholder="Descreva a justificativa para este termo aditivo..."
              required
            />
          </div>

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
