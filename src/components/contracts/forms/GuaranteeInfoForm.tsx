
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GuaranteeInfoFormProps {
  formData: {
    garantiaTipo: string;
    garantiaValor: number;
    garantiaVencimento: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function GuaranteeInfoForm({ formData, onChange }: GuaranteeInfoFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="garantiaTipo">Tipo de Garantia</Label>
        <Select value={formData.garantiaTipo} onValueChange={(value) => onChange('garantiaTipo', value)}>
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
          onChange={(e) => onChange('garantiaValor', parseFloat(e.target.value))}
        />
      </div>
      <div>
        <Label htmlFor="garantiaVencimento">Vencimento da Garantia</Label>
        <Input
          id="garantiaVencimento"
          type="date"
          value={formData.garantiaVencimento}
          onChange={(e) => onChange('garantiaVencimento', e.target.value)}
        />
      </div>
    </div>
  );
}
