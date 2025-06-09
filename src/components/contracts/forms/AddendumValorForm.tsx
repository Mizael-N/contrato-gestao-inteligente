
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AddendumValorFormProps {
  formData: {
    valorAnterior: number;
    valorNovo: number;
  };
  onFormDataChange: (updates: Partial<AddendumValorFormProps['formData']>) => void;
}

export default function AddendumValorForm({ formData, onFormDataChange }: AddendumValorFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="valorAnterior">Valor Anterior (R$)</Label>
        <Input
          id="valorAnterior"
          type="number"
          step="0.01"
          value={formData.valorAnterior}
          onChange={(e) => onFormDataChange({ valorAnterior: parseFloat(e.target.value) })}
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
          onChange={(e) => onFormDataChange({ valorNovo: parseFloat(e.target.value) })}
          required
        />
      </div>
    </div>
  );
}
