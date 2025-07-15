
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserDeleted: () => void;
}

export default function DeleteUserDialog({ 
  open, 
  onOpenChange, 
  user,
  onUserDeleted 
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteUser = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      console.log('🗑️ Deleting user:', user.id);
      
      // Call edge function to delete user
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        toast({
          title: "Erro ao deletar usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Usuário deletado com sucesso');
      toast({
        title: "Sucesso",
        description: `Usuário ${user.name || user.email} deletado com sucesso!`,
      });

      onUserDeleted();
      onOpenChange(false);

    } catch (error: any) {
      console.error('💥 Erro crítico ao deletar usuário:', error);
      toast({
        title: "Erro crítico",
        description: error.message || "Erro inesperado ao deletar usuário",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o usuário <strong>{user?.name || user?.email}</strong>?
            <br />
            Esta ação não pode ser desfeita e removerá permanentemente:
            <ul className="list-disc list-inside mt-2 text-sm">
              <li>Conta de acesso do usuário</li>
              <li>Dados do perfil</li>
              <li>Todas as informações associadas</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteUser}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              'Deletar Usuário'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
