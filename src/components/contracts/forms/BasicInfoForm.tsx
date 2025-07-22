
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicInfoFormProps {
  formData: {
    numero: string;
    objeto: string;
    contratante: string;
    contratada: string;
    valor: number;
    dataAssinatura: string;
    dataInicio?: string;
    dataTermino?: string;
    prazoExecucao: number;
    prazoUnidade: string;
    modalidade: string;
    observacoes: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function BasicInfoForm({ formData, onChange }: BasicInfoFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero">Número do Contrato</Label>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => onChange('numero', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="modalidade">Modalidade</Label>
          <Select value={formData.modalidade} onValueChange={(value) => onChange('modalidade', value)}>
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
          onChange={(e) => onChange('objeto', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contratante">Contratante</Label>
          <Input
            id="contratante"
            value={formData.contratante}
            onChange={(e) => onChange('contratante', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="contratada">Contratada</Label>
          <Input
            id="contratada"
            value={formData.contratada}
            onChange={(e) => onChange('contratada', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => onChange('valor', parseFloat(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="dataAssinatura">Data de Assinatura</Label>
          <Input
            id="dataAssinatura"
            type="date"
            value={formData.dataAssinatura}
            onChange={(e) => onChange('dataAssinatura', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="prazoExecucao">Prazo de Execução</Label>
          <Input
            id="prazoExecucao"
            type="number"
            min="1"
            value={formData.prazoExecucao}
            onChange={(e) => onChange('prazoExecucao', parseInt(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="prazoUnidade">Unidade</Label>
          <Select value={formData.prazoUnidade || 'dias'} onValueChange={(value) => onChange('prazoUnidade', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dias">Dias</SelectItem>
              <SelectItem value="meses">Meses</SelectItem>
              <SelectItem value="anos">Anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataInicio">Data de Início da Vigência</Label>
          <Input
            id="dataInicio"
            type="date"
            value={formData.dataInicio || ''}
            onChange={(e) => onChange('dataInicio', e.target.value)}
            placeholder="Opcional - se não informada, será usada a data de assinatura"
          />
          <p className="text-xs text-gray-500 mt-1">
            Data em que o contrato passa a ter validade jurídica
          </p>
        </div>
        <div>
          <Label htmlFor="dataTermino">Data de Término da Vigência</Label>
          <Input
            id="dataTermino"
            type="date"
            value={formData.dataTermino || ''}
            onChange={(e) => onChange('dataTermino', e.target.value)}
            placeholder="Opcional - será calculada automaticamente"
          />
          <p className="text-xs text-gray-500 mt-1">
            Data em que o contrato expira - calculada automaticamente se não informada
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => onChange('observacoes', e.target.value)}
        />
      </div>
    </div>
  );
}
