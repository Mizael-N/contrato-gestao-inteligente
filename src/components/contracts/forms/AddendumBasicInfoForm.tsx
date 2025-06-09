
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddendumBasicInfoFormProps {
  formData: {
    numero: string;
    tipo: 'prazo' | 'valor' | 'qualitativo';
    dataAssinatura: string;
  };
  onFormDataChange: (updates: Partial<AddendumBasicInfoFormProps['formData']>) => void;
}

export default function AddendumBasicInfoForm({ formData, onFormDataChange }: AddendumBasicInfoFormProps) {
  const getAdditiveTypeOptions = () => [
    { value: 'prazo', label: 'Prorrogação de Prazo' },
    { value: 'valor', label: 'Acréscimo/Supressão de Valor' },
    { value: 'qualitativo', label: 'Alteração Qualitativa' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero">Número do Termo Aditivo</Label>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => onFormDataChange({ numero: e.target.value })}
            placeholder="Ex: 001/2024"
            required
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo do Termo Aditivo</Label>
          <Select 
            value={formData.tipo} 
            onValueChange={(value) => onFormDataChange({ tipo: value as 'prazo' | 'valor' | 'qualitativo' })}
          >
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
          onChange={(e) => onFormDataChange({ dataAssinatura: e.target.value })}
          required
        />
      </div>
    </>
  );
}
