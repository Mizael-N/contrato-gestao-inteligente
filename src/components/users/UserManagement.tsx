
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ShieldCheck, Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateAdminUserDialog from './CreateAdminUserDialog';

export default function UserManagement() {
  const { users, loading, updateUserRole, refetch } = useUsers();
  const { profile } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleRoleChange = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateUserRole(userId, newRole);
  };

  const handleUserCreated = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Gerenciamento de Usuários</span>
              </CardTitle>
              <CardDescription>
                Gerencie roles e permissões dos usuários do sistema
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className="flex items-center space-x-1 w-fit"
                      >
                        {user.role === 'admin' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                        <span>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.id !== profile?.id ? (
                        <Button
                          variant={user.role === 'admin' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleRoleChange(user.id, user.role)}
                        >
                          {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Você mesmo
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAdminUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
