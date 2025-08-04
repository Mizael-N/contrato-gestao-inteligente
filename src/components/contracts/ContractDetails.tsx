
import { Contract } from '@/types/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContractDetailsHeader from './details/ContractDetailsHeader';
import ContractBasicInfo from './details/ContractBasicInfo';
import ContractDates from './details/ContractDates';
import ContractParties from './details/ContractParties';
import ContractFinancialInfo from './details/ContractFinancialInfo';
import ContractAddendums from './details/ContractAddendums';
import ContractDocuments from './details/ContractDocuments';

interface ContractDetailsProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onBack: () => void;
}

export default function ContractDetails({ contract, onEdit, onBack }: ContractDetailsProps) {
  return (
    <div className="space-y-6">
      <ContractDetailsHeader contract={contract} onEdit={onEdit} onBack={onBack} />

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="aditivos">Aditivos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContractBasicInfo contract={contract} />
            <ContractDates contract={contract} />
          </div>

          <ContractParties contract={contract} />

          {contract.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{contract.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <ContractFinancialInfo contract={contract} />
        </TabsContent>

        <TabsContent value="aditivos" className="space-y-4">
          <ContractAddendums contract={contract} />
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <ContractDocuments contract={contract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
