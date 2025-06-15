
import { useState } from 'react';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import SupplierList from './SupplierList';
import SupplierForm from './SupplierForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SupplierManager() {
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setSelectedSupplier(null);
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    let success = false;
    if (selectedSupplier) {
      const result = await updateSupplier(selectedSupplier.id, values);
      if(result) success = true;
    } else {
      const result = await addSupplier(values);
      if(result) success = true;
    }
    setIsSubmitting(false);
    if (success) {
      handleCloseDialog();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fornecedores</h1>
          <p className="text-gray-600 dark:text-gray-300">Gerencie os fornecedores cadastrados no sistema.</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <SupplierList suppliers={suppliers} onEdit={handleEdit} onDelete={deleteSupplier} />
          )}
        </CardContent>
      </Card>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}</DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={selectedSupplier}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
