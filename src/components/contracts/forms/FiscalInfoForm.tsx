
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FiscalInfoFormProps {
  formData: {
    fiscalTitular: string;
    fiscalSubstituto: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function FiscalInfoForm({ formData, onChange }: FiscalInfoFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="fiscalTitular">Fiscal Titular</Label>
        <Input
          id="fiscalTitular"
          value={formData.fiscalTitular}
          onChange={(e) => onChange('fiscalTitular', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="fiscalSubstituto">Fiscal Substituto</Label>
        <Input
          id="fiscalSubstituto"
          value={formData.fiscalSubstituto}
          onChange={(e) => onChange('fiscalSubstituto', e.target.value)}
          required
        />
      </div>
    </div>
  );
}
