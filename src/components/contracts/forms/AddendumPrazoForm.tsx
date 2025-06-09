
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddendumPrazoFormProps {
  formData: {
    prazoAnterior: number;
    prazoNovo: number;
    prazoUnidade: 'dias' | 'meses' | 'anos';
  };
  onFormDataChange: (updates: Partial<AddendumPrazoFormProps['formData']>) => void;
}

export default function AddendumPrazoForm({ formData, onFormDataChange }: AddendumPrazoFormProps) {
  const getPrazoUnidadeOptions = () => [
    { value: 'dias', label: 'Dias' },
    { value: 'meses', label: 'Meses' },
    { value: 'anos', label: 'Anos' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prazoUnidade">Unidade de Prazo</Label>
        <Select 
          value={formData.prazoUnidade} 
          onValueChange={(value) => onFormDataChange({ prazoUnidade: value as 'dias' | 'meses' | 'anos' })}
        >
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
            onChange={(e) => onFormDataChange({ prazoAnterior: parseInt(e.target.value) })}
            disabled
          />
        </div>
        <div>
          <Label htmlFor="prazoNovo">Novo Prazo ({formData.prazoUnidade})</Label>
          <Input
            id="prazoNovo"
            type="number"
            value={formData.prazoNovo}
            onChange={(e) => onFormDataChange({ prazoNovo: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>
    </div>
  );
}
