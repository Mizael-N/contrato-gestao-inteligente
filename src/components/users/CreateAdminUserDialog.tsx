
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UserPlus } from 'lucide-react';

const createAdminUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

type CreateAdminUserForm = z.infer<typeof createAdminUserSchema>;

interface CreateAdminUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export default function CreateAdminUserDialog({ 
  open, 
  onOpenChange, 
  onUserCreated 
}: CreateAdminUserDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateAdminUserForm>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const handleCreateAdminUser = async (values: CreateAdminUserForm) => {
    setIsCreating(true);
    
    try {
      console.log('🔧 Criando usuário admin:', values.email);
      
      // Criar usuário usando admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        user_metadata: {
          name: values.name,
        },
        email_confirm: true, // Auto-confirmar email para admins
      });

      if (error) {
        console.error('❌ Erro ao criar usuário:', error);
        toast({
          title: "Erro ao criar usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data.user) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o usuário",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Usuário criado, definindo como admin:', data.user.id);

      // Aguardar um momento para garantir que o profile foi criado pelo trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar o role para admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', data.user.id);

      if (updateError) {
        console.error('❌ Erro ao definir role admin:', updateError);
        toast({
          title: "Usuário criado",
          description: "Usuário criado, mas houve erro ao definir como admin. Ajuste manualmente.",
          variant: "destructive",
        });
      } else {
        console.log('✅ Role admin definido com sucesso');
        toast({
          title: "Sucesso",
          description: `Usuário admin ${values.name} criado com sucesso!`,
        });
      }

      form.reset();
      onUserCreated();
      onOpenChange(false);

    } catch (error: any) {
      console.error('💥 Erro crítico ao criar usuário admin:', error);
      toast({
        title: "Erro crítico",
        description: error.message || "Erro inesperado ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Criar Usuário Administrador</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateAdminUser)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome completo" 
                      disabled={isCreating}
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
                      placeholder="admin@exemplo.com" 
                      disabled={isCreating}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Senha (mín. 6 caracteres)" 
                      disabled={isCreating}
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
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Admin
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
