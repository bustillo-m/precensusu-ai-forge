import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loadPromptTemplate(): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/templates/prompts/planner.txt`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.log('Could not load custom prompt template, using default');
  }
  
  // Default prompt if file not found
  return `You are a ChatGPT Planner for n8n workflow automation. Analyze the user request and create a structured plan.

User Request: {{PROMPT}}

Create a JSON plan with: objective, category, subcategory, trigger, steps, integrations_needed, complexity, estimated_nodes, requirements.

Focus on marketing agency workflows. Be specific about n8n nodes and integrations needed.`;
}

interface PlannerRequest {
  prompt: string;
  workflow_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, workflow_id }: PlannerRequest = await req.json();

    // Log execution start
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 1,
      step_name: 'chatgpt_planner',
      input_data: { prompt },
      status: 'running'
    });

    const startTime = Date.now();

    if (!openAIApiKey) {
      // Send request for API credentials
      await supabase.functions.invoke('request-credentials', {
        body: {
          service: 'OpenAI',
          api_key_name: 'OPENAI_API_KEY',
          workflow_id,
          step: 'planner'
        }
      });

      throw new Error('OpenAI API key not configured. Credentials request sent.');
    }

    const promptTemplate = await loadPromptTemplate();
    const systemPrompt = promptTemplate.replace('{{PROMPT}}', prompt);

    console.log(`Planning workflow for prompt: ${prompt.substring(0, 100)}...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Create a detailed automation plan for: ${prompt}`
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const plan = JSON.parse(data.choices[0].message.content);

    const executionTime = Date.now() - startTime;

    // Log execution completion
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 1,
      step_name: 'chatgpt_planner',
      input_data: { prompt },
      output_data: { plan },
      status: 'completed',
      execution_time_ms: executionTime
    });

    console.log(`ChatGPT Planner completed in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      plan,
      execution_time_ms: executionTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ChatGPT Planner error:', error);

    // Log execution error
    if (req.body) {
      const { workflow_id } = await req.json();
      await supabase.from('workflow_executions').insert({
        workflow_id,
        step_number: 1,
        step_name: 'chatgpt_planner',
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