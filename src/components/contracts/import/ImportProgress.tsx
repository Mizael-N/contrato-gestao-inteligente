
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Loader2 } from "lucide-react";

interface ImportProgressProps {
  importing: boolean;
  progress: { stage: string; progress: number; message: string } | null;
  fileType: 'spreadsheet';
}

export default function ImportProgress({ importing, progress, fileType }: ImportProgressProps) {
  if (!importing && !progress) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Processando Planilha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{progress.message}</span>
            </div>
            <Progress value={progress.progress} className="w-full" />
            <div className="text-xs text-muted-foreground">
              {progress.progress}% - {progress.stage}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
