
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';

const editUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

export default function EditUserDialog({ 
  open, 
  onOpenChange, 
  user,
  onUserUpdated 
}: EditUserDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Update form when user changes
  useState(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
      });
    }
  });

  const handleUpdateUser = async (values: EditUserForm) => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      console.log('🔧 Updating user:', user.id, values);
      
      // Update user profile (this will work with current RLS policies)
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          email: values.email,
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        toast({
          title: "Erro ao atualizar usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Usuário atualizado com sucesso');
      toast({
        title: "Sucesso",
        description: `Usuário ${values.name} atualizado com sucesso!`,
      });

      onUserUpdated();
      onOpenChange(false);

    } catch (error: any) {
      console.error('💥 Erro crítico ao atualizar usuário:', error);
      toast({
        title: "Erro crítico",
        description: error.message || "Erro inesperado ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>Editar Usuário</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome completo" 
                      disabled={isUpdating}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="usuario@exemplo.com" 
                      disabled={isUpdating}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
