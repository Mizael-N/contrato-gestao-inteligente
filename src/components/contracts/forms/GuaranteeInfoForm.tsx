
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
  const guaranteeTypeOptions = [
    { value: 'sem_garantia', label: 'Sem garantia' },
    { value: 'caucao', label: 'Caução' },
    { value: 'seguro_garantia', label: 'Seguro Garantia' },
    { value: 'fianca_bancaria', label: 'Fiança Bancária' },
  ];

  const selectValue = formData.garantiaTipo || 'sem_garantia';
  const isWithoutGuarantee = selectValue === 'sem_garantia';
  
  console.log('GuaranteeInfoForm - formData.garantiaTipo:', formData.garantiaTipo);
  console.log('GuaranteeInfoForm - selectValue:', selectValue);
  console.log('GuaranteeInfoForm - isWithoutGuarantee:', isWithoutGuarantee);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="garantiaTipo">Tipo de Garantia</Label>
        <Select value={selectValue} onValueChange={(value) => onChange('garantiaTipo', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de garantia" />
          </SelectTrigger>
          <SelectContent>
            {guaranteeTypeOptions.map(option => {
              console.log('Rendering guarantee SelectItem with value:', option.value);
              return (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="garantiaValor">Valor da Garantia (R$)</Label>
        <Input
          id="garantiaValor"
          type="number"
          step="0.01"
          min="0"
          value={formData.garantiaValor}
          onChange={(e) => onChange('garantiaValor', parseFloat(e.target.value) || 0)}
          disabled={isWithoutGuarantee}
          placeholder={isWithoutGuarantee ? "Sem garantia" : "0,00"}
        />
      </div>
      <div>
        <Label htmlFor="garantiaVencimento">Vencimento da Garantia</Label>
        <Input
          id="garantiaVencimento"
          type="date"
          value={formData.garantiaVencimento}
          onChange={(e) => onChange('garantiaVencimento', e.target.value)}
          disabled={isWithoutGuarantee}
          placeholder={isWithoutGuarantee ? "Sem vencimento" : ""}
        />
      </div>
    </div>
  );
}
