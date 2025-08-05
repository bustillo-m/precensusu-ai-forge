import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileJson, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JsonUploaderProps {
  onClose: () => void;
}

export const JsonUploader = ({ onClose }: JsonUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [workflowId, setWorkflowId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file);
        setUploadStatus('idle');
        setErrorMessage('');
      } else {
        toast({
          variant: "destructive",
          title: "Archivo inválido",
          description: "Por favor selecciona un archivo JSON válido.",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Leer el contenido del archivo JSON
      const fileContent = await selectedFile.text();
      const workflowData = JSON.parse(fileContent);

      // Validar que tiene la estructura básica de un workflow
      if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
        throw new Error('El archivo JSON no tiene la estructura de un workflow válido de n8n. Debe contener un array "nodes".');
      }

      // Enviar el workflow a n8n usando el edge function
      const { data, error } = await supabase.functions.invoke('send-to-n8n', {
        body: { workflow: workflowData }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setUploadStatus('success');
        setWorkflowId(data.workflowId);
        toast({
          title: "¡Éxito!",
          description: `Workflow "${data.workflowName}" creado en n8n exitosamente`,
        });
      } else {
        throw new Error(data.error || 'Error desconocido al crear el workflow');
      }

    } catch (error) {
      console.error('Error uploading JSON:', error);
      setUploadStatus('error');
      setErrorMessage(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error al subir el archivo: ${error.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setWorkflowId('');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-6 w-6 text-primary" />
            Subir Automatización JSON a n8n
          </CardTitle>
          <CardDescription>
            Selecciona un archivo JSON con un workflow de n8n para importarlo directamente a tu instancia
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <Label htmlFor="json-file">Archivo JSON del Workflow</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-4">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <Input
                  id="json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label
                  htmlFor="json-file"
                  className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                >
                  Haz clic aquí para seleccionar un archivo JSON
                  <br />
                  <span className="text-xs">Solo archivos .json</span>
                </Label>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <FileJson className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetUploader}>
                  Cambiar
                </Button>
              </div>
            )}
          </div>

          {/* Status Section */}
          {uploadStatus !== 'idle' && (
            <div className="p-4 rounded-lg border">
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Workflow subido exitosamente</p>
                    {workflowId && (
                      <p className="text-sm text-muted-foreground">ID del workflow: {workflowId}</p>
                    )}
                  </div>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error al subir workflow</p>
                    {errorMessage && (
                      <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Instrucciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Selecciona un archivo JSON exportado desde n8n</li>
              <li>El archivo debe contener un workflow válido con nodos y conexiones</li>
              <li>El workflow se creará automáticamente en tu instancia de n8n configurada</li>
              <li>Una vez subido, estará listo para usar en tu n8n</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir a n8n
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};