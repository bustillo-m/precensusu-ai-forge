import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loadPromptTemplate(): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/templates/prompts/optimizer.txt`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.log('Could not load custom prompt template, using default');
  }
  
  return `You are a DeepSeek Optimizer for n8n workflows. Take the refined plan and optimize it for maximum efficiency, scalability, and maintainability.

Refined Plan: {{REFINED_PLAN}}

Apply advanced optimizations: performance optimization, scalability, reliability, monitoring & analytics, and production readiness.

Output a highly optimized workflow specification ready for final n8n conversion.`;
}

interface OptimizerRequest {
  refined_plan: any;
  workflow_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refined_plan, workflow_id }: OptimizerRequest = await req.json();

    // Log execution start
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 3,
      step_name: 'deepseek_optimizer',
      input_data: { refined_plan },
      status: 'running'
    });

    const startTime = Date.now();

    if (!deepseekApiKey) {
      // Send request for API credentials
      await supabase.functions.invoke('request-credentials', {
        body: {
          service: 'DeepSeek',
          api_key_name: 'DEEPSEEK_API_KEY',
          workflow_id,
          step: 'optimizer'
        }
      });

      throw new Error('DeepSeek API key not configured. Credentials request sent.');
    }

    const promptTemplate = await loadPromptTemplate();
    const systemPrompt = promptTemplate.replace('{{REFINED_PLAN}}', JSON.stringify(refined_plan, null, 2));

    console.log(`Optimizing plan for workflow ${workflow_id}`);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Optimize this n8n workflow plan for production: ${JSON.stringify(refined_plan, null, 2)}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    let optimizedSpecification;

    try {
      // Try to extract JSON from DeepSeek's response
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        optimizedSpecification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback: return refined plan with optimization notes
      optimizedSpecification = {
        ...refined_plan,
        optimization_notes: data.choices[0].message.content,
        optimization_status: 'partial'
      };
    }

    const executionTime = Date.now() - startTime;

    // Log execution completion
    await supabase.from('workflow_executions').insert({
      workflow_id,
      step_number: 3,
      step_name: 'deepseek_optimizer',
      input_data: { refined_plan },
      output_data: { optimized_specification: optimizedSpecification },
      status: 'completed',
      execution_time_ms: executionTime
    });

    console.log(`DeepSeek Optimizer completed in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      optimized_specification: optimizedSpecification,
      execution_time_ms: executionTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('DeepSeek Optimizer error:', error);

    // Log execution error
    if (req.body) {
      const { workflow_id } = await req.json();
      await supabase.from('workflow_executions').insert({
        workflow_id,
        step_number: 3,
        step_name: 'deepseek_optimizer',
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