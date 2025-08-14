import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface AutomationFormProps {
  onWorkflowGenerated?: (workflow: any) => void;
}

export const AutomationForm = ({ onWorkflowGenerated }: AutomationFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setCurrentStep('Iniciando orquestación...');
    
    try {
      const { data, error } = await supabase.functions.invoke('orchestrate', {
        body: { 
          prompt: prompt.trim(),
          dry_run: false 
        }
      });

      if (error) throw error;

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
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generando...' : 'Generar Automatización'}
          </Button>

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
              <div className="text-destructive">
                <p>Error: {result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};