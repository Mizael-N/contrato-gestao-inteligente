
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Eye, EyeOff, Settings as SettingsIcon, Database, Bell } from 'lucide-react';
import BackupManager from '@/components/backup/BackupManager';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, signOut, user } = useAuth();
  const { showNotification } = useNotifications();
  const [isClearing, setIsClearing] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  const handleClearData = async () => {
    if (!isAdmin) {
      showNotification(
        "Acesso negado",
        "Apenas administradores podem zerar o sistema.",
        'error'
      );
      return;
    }

    if (!password.trim()) {
      showNotification(
        "Senha obrigatória",
        "Digite sua senha para confirmar esta ação.",
        'error'
      );
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
      
      showNotification(
        "Dados removidos",
        "Todos os dados do sistema foram removidos com sucesso.",
        'success'
      );

      setPassword(''); // Limpar senha após sucesso
      
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      showNotification(
        "Erro",
        error instanceof Error ? error.message : "Erro ao remover os dados do sistema.",
        'error'
      );
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
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="appearance" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <BackupManager />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
