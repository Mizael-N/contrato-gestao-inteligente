
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BackupService, BackupData } from '@/services/backupService';
import { useNotifications } from '@/contexts/NotificationContext';
import { Download, Upload, AlertTriangle, FileCheck } from 'lucide-react';

export default function BackupManager() {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const { showNotification } = useNotifications();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const backupData = await BackupService.exportData();
      await BackupService.downloadBackup(backupData);
      
      showNotification(
        'Backup Criado',
        `Dados exportados com sucesso! ${backupData.contracts.length} contratos incluídos.`,
        'success'
      );
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      showNotification(
        'Erro no Backup',
        'Falha ao criar backup dos dados.',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await BackupService.validateBackupFile(file);
      setSelectedFile(file);
      setPreviewData(data);
      
      showNotification(
        'Arquivo Validado',
        'Arquivo de backup é válido e está pronto para restauração.',
        'success'
      );
    } catch (error) {
      console.error('Erro ao validar arquivo:', error);
      showNotification(
        'Arquivo Inválido',
        error instanceof Error ? error.message : 'Arquivo de backup inválido.',
        'error'
      );
      setSelectedFile(null);
      setPreviewData(null);
    }
  };

  const handleRestore = async () => {
    if (!previewData) return;

    try {
      setIsRestoring(true);
      await BackupService.restoreData(previewData);
      
      showNotification(
        'Restauração Concluída',
        'Dados restaurados com sucesso! A página será recarregada.',
        'success'
      );
      
      // Recarregar a página após 2 segundos para atualizar todos os dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao restaurar dados:', error);
      showNotification(
        'Erro na Restauração',
        'Falha ao restaurar dados do backup.',
        'error'
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Exportar Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Criar Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Exporta todos os contratos, fornecedores e configurações em um arquivo JSON.
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              {isExporting ? 'Exportando...' : 'Baixar Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Importar Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurar Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Selecione um arquivo de backup para restaurar os dados.
            </div>
            
            <div>
              <Label htmlFor="backup-file">Arquivo de Backup (.json)</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelection}
                className="mt-2"
              />
            </div>

            {previewData && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Arquivo Validado</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Data do backup: {new Date(previewData.timestamp).toLocaleString('pt-BR')}</div>
                  <div>Contratos: {previewData.contracts.length}</div>
                  <div>Fornecedores: {previewData.suppliers?.length || 0}</div>
                  <div>Versão: {previewData.version}</div>
                </div>
              </div>
            )}

            {selectedFile && previewData && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={isRestoring}
                    className="w-full sm:w-auto"
                  >
                    {isRestoring ? 'Restaurando...' : 'Restaurar Dados'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Confirmar Restauração
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <div>Esta ação irá:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Sobrescrever dados existentes com IDs duplicados</li>
                        <li>Adicionar novos dados do backup</li>
                        <li>Manter dados que não estão no backup</li>
                      </ul>
                      <div className="font-medium text-destructive mt-3">
                        Recomendamos criar um backup atual antes de prosseguir.
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleRestore}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Confirmar Restauração
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
