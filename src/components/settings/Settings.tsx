import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, signOut, user } = useAuth();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  const handleClearData = async () => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem zerar o sistema.",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Digite sua senha para confirmar esta ação.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPassword(true);
    
    try {
      // Primeiro validar a senha do usuário
      if (!user?.email) {
        throw new Error("Email do usuário não encontrado");
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        throw new Error("Senha incorreta");
      }

      setIsClearing(true);
      
      // Usar a função do banco de dados que tem SECURITY DEFINER
      const { data, error } = await supabase.rpc('clear_all_system_data');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Dados removidos",
        description: "Todos os dados do sistema foram removidos com sucesso.",
      });

      setPassword(''); // Limpar senha após sucesso
      
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover os dados do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
      setIsValidatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-300">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        {/* Configurações de Aparência */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <div className="text-sm text-muted-foreground">
                  Alterne entre tema claro e escuro
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Backup e Restauração</Label>
              <div className="text-sm text-muted-foreground mb-3">
                Gerencie os dados do sistema
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Exportar Dados
                </Button>
                <Button variant="outline" className="w-full">
                  Importar Dados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="contract-alerts">Alertas de Contrato</Label>
                <div className="text-sm text-muted-foreground">
                  Receber notificações sobre contratos vencendo
                </div>
              </div>
              <Switch id="contract-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="payment-alerts">Alertas de Pagamento</Label>
                <div className="text-sm text-muted-foreground">
                  Receber notificações sobre pagamentos pendentes
                </div>
              </div>
              <Switch id="payment-alerts" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent>
              <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
              </Button>
          </CardContent>
        </Card>

        {/* Zona de Perigo - Apenas para Administradores */}
        {isAdmin && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-destructive">Remover Todos os Dados</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    Esta ação irá remover permanentemente todos os contratos, aditivos, pagamentos e documentos do sistema.
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isClearing || isValidatingPassword}>
                      {isClearing ? 'Removendo...' : 'Zerar Sistema'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirme sua senha</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá remover permanentemente todos os dados do sistema, incluindo:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Todos os contratos</li>
                          <li>Todos os termos aditivos</li>
                          <li>Todos os pagamentos</li>
                          <li>Todos os documentos</li>
                          <li>Todos os fornecedores</li>
                        </ul>
                        <div className="mt-4">
                          <Label htmlFor="password-confirm">Digite sua senha para confirmar:</Label>
                          <div className="relative mt-2">
                            <Input
                              id="password-confirm"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Sua senha atual"
                              className="pr-10"
                              disabled={isValidatingPassword || isClearing}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isValidatingPassword || isClearing}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setPassword('')}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearData} 
                        className="bg-destructive text-destructive-foreground"
                        disabled={!password.trim() || isValidatingPassword || isClearing}
                      >
                        {isValidatingPassword ? 'Validando...' : isClearing ? 'Removendo...' : 'Sim, zerar sistema'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso para usuários comuns */}
        {!isAdmin && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Acesso Restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Algumas configurações avançadas estão disponíveis apenas para administradores do sistema.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
