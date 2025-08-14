import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const n8nWorkflowUrl = Deno.env.get('N8N_WORKFLOW_URL');
const n8nApiToken = Deno.env.get('N8N_API_TOKEN');
const n8nAssistantApiKey = Deno.env.get('N8N_ASSISTANT_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loadPromptTemplate(): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/templates/prompts/finalizer.txt`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.log('Could not load custom prompt template, using default');
  }
  
  return `You are the N8n Assistant Finalizer. Transform the optimized specification into a complete, valid n8n workflow JSON.

Optimized Specification: {{OPTIMIZED_SPEC}}

Generate a complete n8n workflow JSON with: proper UUIDs, correct node connections, required logging and error handling nodes, valid schema compliance.

Output only the final n8n workflow JSON that can be directly imported.`;
}

async function loadSnippets() {
  try {
    const [loggingResponse, errorHandlerResponse] = await Promise.all([
      fetch(`${supabaseUrl}/storage/v1/object/public/templates/snippets/logging.json`),
      fetch(`${supabaseUrl}/storage/v1/object/public/templates/snippets/error_handler.json`)
    ]);

    const logging = loggingResponse.ok ? await loggingResponse.json() : null;
    const errorHandler = errorHandlerResponse.ok ? await errorHandlerResponse.json() : null;

    return { logging, errorHandler };
  } catch (error) {
    console.log('Could not load snippets, will use basic templates');
    return { logging: null, errorHandler: null };
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function createBasicN8nWorkflow(specification: any): any {
  const workflowId = generateUUID();
  
  return {
    "name": specification.workflow_specification?.name || "Generated Workflow",
    "nodes": [
      {
        "id": generateUUID(),
        "name": "Start",
        "type": "@n8n/n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [240, 300],
        "parameters": {}
      }
    ],
    "connections": {},
    "active": false,
    "settings": {
      "executionOrder": "v1"
    },
    "staticData": {},
    "tags": [],
    "triggerCount": 0,
    "updatedAt": new Date().toISOString(),
    "versionId": workflowId
  };
}

interface AssistantRequest {
  optimized_spec: any;
  workflow_id: string;
  dry_run?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { optimized_spec, workflow_id, dry_run = false }: AssistantRequest = await req.json();

    // Log execution start
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 4,
      step_name: 'n8n_assistant',
      input_data: { optimized_spec, dry_run },
      status: 'running'
    });

    const startTime = Date.now();

    // Load snippets for enhanced workflow
    const snippets = await loadSnippets();

    let workflowJson;

    if (!n8nAssistantApiKey) {
      // Send request for API credentials
      await supabase.functions.invoke('request-credentials', {
        body: {
          service: 'N8n Assistant',
          api_key_name: 'N8N_ASSISTANT_API_KEY',
          workflow_id,
          step: 'finalizer'
        }
      });

      console.log('N8n Assistant API key not configured, generating basic workflow');
      
      // Generate basic workflow as fallback
      workflowJson = createBasicN8nWorkflow(optimized_spec);
      
    } else {
      const promptTemplate = await loadPromptTemplate();
      const systemPrompt = promptTemplate.replace('{{OPTIMIZED_SPEC}}', JSON.stringify(optimized_spec, null, 2));

      console.log(`Generating final n8n workflow for ${workflow_id}`);

      const response = await fetch('https://api.n8n-assistant.com/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${n8nAssistantApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specification: optimized_spec,
          system_prompt: systemPrompt,
          include_logging: true,
          include_error_handling: true,
          dry_run
        }),
      });

      if (!response.ok) {
        console.log('N8n Assistant API failed, falling back to basic generation');
        workflowJson = createBasicN8nWorkflow(optimized_spec);
      } else {
        const data = await response.json();
        workflowJson = data.workflow_json;
        
        // If N8N workflow URL is configured, send workflow to N8N
        if (n8nWorkflowUrl && n8nApiToken && !dry_run) {
          try {
            console.log('Sending workflow to N8N instance...');
            const n8nResponse = await fetch(`${n8nWorkflowUrl}/api/v1/workflows`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${n8nApiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: workflowJson.name || 'Generated Workflow',
                nodes: workflowJson.nodes,
                connections: workflowJson.connections,
                active: true
              }),
            });
            
            if (n8nResponse.ok) {
              const n8nData = await n8nResponse.json();
              console.log(`Workflow created in N8N with ID: ${n8nData.id}`);
              workflowJson.n8n_workflow_id = n8nData.id;
            } else {
              console.log('Failed to create workflow in N8N:', await n8nResponse.text());
            }
          } catch (error) {
            console.log('Error sending workflow to N8N:', error);
          }
        }
      }
    }

    // Enhance workflow with logging and error handling if snippets available
    if (snippets.logging && snippets.errorHandler) {
      workflowJson.nodes.push(
        { ...snippets.logging, id: generateUUID(), position: [workflowJson.nodes.length * 200, 400] },
        { ...snippets.errorHandler, id: generateUUID(), position: [workflowJson.nodes.length * 200, 600] }
      );
    }

    const executionTime = Date.now() - startTime;

    // Log execution completion
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 4,
      step_name: 'n8n_assistant',
      input_data: { optimized_spec, dry_run },
      output_data: { workflow_json: workflowJson },
      status: 'completed',
      execution_time_ms: executionTime
    });

    console.log(`N8n Assistant completed in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      workflow_json: workflowJson,
      execution_time_ms: executionTime,
      dry_run
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('N8n Assistant error:', error);

    // Log execution error
    if (req.body) {
      const { workflow_id } = await req.json();
      await supabase.from('workflow_executions').insert({
        workflow_id,
        step_number: 4,
        step_name: 'n8n_assistant',
        status: 'failed',
        error_message: error.message
      });
    }

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});