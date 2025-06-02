
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddendumInfoFormProps {
  formData: {
    tipoAditivo: string;
    dataAditivo: string;
    justificativaAditivo: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function AddendumInfoForm({ formData, onChange }: AddendumInfoFormProps) {
  const aditivoOptions = [
    { value: '', label: 'Nenhum aditivo' },
    { value: 'prazo', label: 'Prorrogação de Prazo' },
    { value: 'valor', label: 'Acréscimo ou Supressão de Valor' },
    { value: 'qualitativo', label: 'Alteração Qualitativa' },
    { value: 'reequilibrio', label: 'Reequilíbrio Econômico-Financeiro' },
    { value: 'localizacao', label: 'Alteração de Localização' },
    { value: 'responsabilidade', label: 'Transferência de Responsabilidade' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Termo Aditivo (Opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipoAditivo">Tipo de Aditivo</Label>
            <Select value={formData.tipoAditivo} onValueChange={(value) => onChange('tipoAditivo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de aditivo" />
              </SelectTrigger>
              <SelectContent>
                {aditivoOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dataAditivo">Data do Aditivo</Label>
            <Input
              id="dataAditivo"
              type="date"
              value={formData.dataAditivo}
              onChange={(e) => onChange('dataAditivo', e.target.value)}
              disabled={!formData.tipoAditivo}
            />
          </div>
        </div>
        
        {formData.tipoAditivo && (
          <div>
            <Label htmlFor="justificativaAditivo">Justificativa do Aditivo</Label>
            <Textarea
              id="justificativaAditivo"
              value={formData.justificativaAditivo}
              onChange={(e) => onChange('justificativaAditivo', e.target.value)}
              placeholder="Descreva a justificativa para o termo aditivo"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
