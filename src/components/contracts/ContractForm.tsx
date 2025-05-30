
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Contract } from '@/types/contract';

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
    prazoExecucao: contract?.prazoExecucao || 365,
    modalidade: contract?.modalidade || 'pregao',
    status: contract?.status || 'vigente',
    observacoes: contract?.observacoes || '',
    fiscalTitular: contract?.fiscais?.titular || '',
    fiscalSubstituto: contract?.fiscais?.substituto || '',
    garantiaTipo: contract?.garantia?.tipo || 'caucao',
    garantiaValor: contract?.garantia?.valor || 0,
    garantiaVencimento: contract?.garantia?.dataVencimento || '',
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número do Contrato</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="modalidade">Modalidade</Label>
              <Select value={formData.modalidade} onValueChange={(value) => setFormData({ ...formData, modalidade: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pregao">Pregão</SelectItem>
                  <SelectItem value="concorrencia">Concorrência</SelectItem>
                  <SelectItem value="tomada_precos">Tomada de Preços</SelectItem>
                  <SelectItem value="convite">Convite</SelectItem>
                  <SelectItem value="concurso">Concurso</SelectItem>
                  <SelectItem value="leilao">Leilão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="objeto">Objeto do Contrato</Label>
            <Textarea
              id="objeto"
              value={formData.objeto}
              onChange={(e) => setFormData({ ...formData, objeto: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contratante">Contratante</Label>
              <Input
                id="contratante"
                value={formData.contratante}
                onChange={(e) => setFormData({ ...formData, contratante: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contratada">Contratada</Label>
              <Input
                id="contratada"
                value={formData.contratada}
                onChange={(e) => setFormData({ ...formData, contratada: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                required
              />
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
            <div>
              <Label htmlFor="prazoExecucao">Prazo de Execução (dias)</Label>
              <Input
                id="prazoExecucao"
                type="number"
                value={formData.prazoExecucao}
                onChange={(e) => setFormData({ ...formData, prazoExecucao: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fiscalTitular">Fiscal Titular</Label>
              <Input
                id="fiscalTitular"
                value={formData.fiscalTitular}
                onChange={(e) => setFormData({ ...formData, fiscalTitular: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fiscalSubstituto">Fiscal Substituto</Label>
              <Input
                id="fiscalSubstituto"
                value={formData.fiscalSubstituto}
                onChange={(e) => setFormData({ ...formData, fiscalSubstituto: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="garantiaTipo">Tipo de Garantia</Label>
              <Select value={formData.garantiaTipo} onValueChange={(value) => setFormData({ ...formData, garantiaTipo: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caucao">Caução</SelectItem>
                  <SelectItem value="seguro_garantia">Seguro Garantia</SelectItem>
                  <SelectItem value="fianca_bancaria">Fiança Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="garantiaValor">Valor da Garantia (R$)</Label>
              <Input
                id="garantiaValor"
                type="number"
                step="0.01"
                value={formData.garantiaValor}
                onChange={(e) => setFormData({ ...formData, garantiaValor: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="garantiaVencimento">Vencimento da Garantia</Label>
              <Input
                id="garantiaVencimento"
                type="date"
                value={formData.garantiaVencimento}
                onChange={(e) => setFormData({ ...formData, garantiaVencimento: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

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
