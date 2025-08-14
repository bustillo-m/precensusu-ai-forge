import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loadPromptTemplate(): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/templates/prompts/refiner.txt`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.log('Could not load custom prompt template, using default');
  }
  
  return `You are a Claude Refiner for n8n workflow optimization. Take the initial plan and refine it for better structure, efficiency, and best practices.

Initial Plan: {{PLAN}}

Refine and improve this plan with optimized structure, error handling, security, performance optimizations, and best practices.

Output a refined JSON plan with detailed node configurations and optimizations.`;
}

interface RefinerRequest {
  plan: any;
  workflow_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, workflow_id }: RefinerRequest = await req.json();

    // Log execution start
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 2,
      step_name: 'claude_refiner',
      input_data: { plan },
      status: 'running'
    });

    const startTime = Date.now();

    if (!anthropicApiKey) {
      // Send request for API credentials
      await supabase.functions.invoke('request-credentials', {
        body: {
          service: 'Anthropic',
          api_key_name: 'ANTHROPIC_API_KEY',
          workflow_id,
          step: 'refiner'
        }
      });

      throw new Error('Anthropic API key not configured. Credentials request sent.');
    }

    const promptTemplate = await loadPromptTemplate();
    const systemPrompt = promptTemplate.replace('{{PLAN}}', JSON.stringify(plan, null, 2));

    console.log(`Refining plan for workflow ${workflow_id}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Please refine and optimize this n8n workflow plan: ${JSON.stringify(plan, null, 2)}`
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    let refinedPlan;

    try {
      // Try to extract JSON from Claude's response
      const content = data.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        refinedPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback: return original plan with refinement notes
      refinedPlan = {
        ...plan,
        refinement_notes: data.content[0].text,
        refinement_status: 'partial'
      };
    }

    const executionTime = Date.now() - startTime;

    // Log execution completion
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 2,
      step_name: 'claude_refiner',
      input_data: { plan },
      output_data: { refined_plan: refinedPlan },
      status: 'completed',
      execution_time_ms: executionTime
    });

    console.log(`Claude Refiner completed in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      refined_plan: refinedPlan,
      execution_time_ms: executionTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Claude Refiner error:', error);

    // Log execution error
    if (req.body) {
      const { workflow_id } = await req.json();
      await supabase.from('workflow_executions').insert({
        workflow_id,
        step_number: 2,
        step_name: 'claude_refiner',
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