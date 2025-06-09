
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AddendumJustificativaFormProps {
  justificativa: string;
  onJustificativaChange: (justificativa: string) => void;
}

export default function AddendumJustificativaForm({ justificativa, onJustificativaChange }: AddendumJustificativaFormProps) {
  return (
    <div>
      <Label htmlFor="justificativa">Justificativa</Label>
      <Textarea
        id="justificativa"
        value={justificativa}
        onChange={(e) => onJustificativaChange(e.target.value)}
        placeholder="Descreva a justificativa para este termo aditivo..."
        required
      />
    </div>
  );
}
