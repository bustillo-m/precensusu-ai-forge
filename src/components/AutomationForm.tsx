import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface AutomationFormProps {
  onWorkflowGenerated?: (workflow: any) => void;
}

export const AutomationForm = ({ onWorkflowGenerated }: AutomationFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!user) {
      setResult({ error: 'Debes estar autenticado para crear automatizaciones' });
      return;
    }

    setIsGenerating(true);
    setCurrentStep('Iniciando orquestación...');
    
    try {
      // Check if essential credentials are configured by testing the orchestrate function
      setCurrentStep('Verificando credenciales...');
      
      const { data, error } = await supabase.functions.invoke('orchestrate', {
        body: { 
          prompt: prompt.trim(),
          user_id: user.id,
          dry_run: false 
        }
      });

      if (error) {
        console.error('Detailed error from orchestrate function:', error);
        
        // Check if it's a credentials error
        if (error.message?.includes('API key') || error.message?.includes('credential') || 
            error.message?.includes('OpenAI') || error.message?.includes('Claude') || 
            error.message?.includes('DeepSeek')) {
          setCurrentStep('Solicitando credenciales por email...');
          
          // Send email request for missing credentials
          await supabase.functions.invoke('request-credentials', {
            body: {
              service: 'Sistema de Automatización',
              api_key_name: 'MULTIPLE_APIS',
              message: `Faltan credenciales para completar la automatización: "${prompt.substring(0, 100)}...". Error: ${error.message}`
            }
          });
          
          setResult({ 
            error: 'Faltan credenciales de API. Se ha enviado un correo solicitando la configuración necesaria.',
            credentials_requested: true,
            technical_error: error.message
          });
          setCurrentStep('Credenciales solicitadas por email');
          return;
        }
        
        // For other errors, show more detail
        setResult({ 
          error: `Error en el proceso de automatización: ${error.message}`,
          technical_details: error
        });
        setCurrentStep('Error detectado');
        return;
      }

      setResult(data);
      onWorkflowGenerated?.(data);
      setCurrentStep('¡Completado!');
    } catch (error: any) {
      console.error('Error generating workflow:', error);
      setResult({ error: error.message });
      setCurrentStep('Error en la generación');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Automatización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe la automatización que necesitas (ej: crear reels automáticos, generar posts de blog, etc.)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || !user}
            className="w-full"
          >
            {isGenerating ? 'Generando...' : 'Generar Automatización'}
          </Button>

          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              Debes estar autenticado para crear automatizaciones
            </p>
          )}

          {isGenerating && (
            <div className="text-center">
              <Badge variant="secondary">{currentStep}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? '✅ Workflow Generado' : '❌ Error'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <p>Workflow ID: <code>{result.workflow_id}</code></p>
                <details>
                  <summary className="cursor-pointer font-medium">Ver JSON del Workflow</summary>
                  <pre className="mt-2 p-4 bg-muted rounded text-sm overflow-auto">
                    {JSON.stringify(result.workflow_json, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-destructive">
                  <p>Error: {result.error}</p>
                </div>
                {result.credentials_requested && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      📧 Se ha enviado una solicitud de credenciales a u1974564828@gmail.com
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};