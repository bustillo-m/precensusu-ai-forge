import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Use service role key for database operations that bypass RLS when needed
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

interface OrchestrationRequest {
  prompt: string;
  user_id?: string;
  dry_run?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, user_id, dry_run = false }: OrchestrationRequest = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authenticated user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user from the authorization token
    const token = authHeader.replace('Bearer ', '');
    let authenticatedUserId = user_id;
    
    if (!authenticatedUserId) {
      try {
        // Parse the JWT token to get the user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        authenticatedUserId = payload.sub;
      } catch (e) {
        console.error('Error parsing JWT token:', e);
        return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'User authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting orchestration for user ${authenticatedUserId} with prompt: ${prompt.substring(0, 100)}...`);

    // Create workflow record with authenticated user ID
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .insert({
        user_id: authenticatedUserId,
        title: `Automation: ${prompt.substring(0, 50)}...`,
        description: prompt,
        workflow_json: {},
        status: 'processing'
      })
      .select()
      .single();

    if (workflowError) {
      console.error('Error creating workflow:', workflowError);
      return new Response(JSON.stringify({ error: 'Failed to create workflow' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const workflowId = workflow.id;

    // Step 1: ChatGPT Planner
    console.log('Step 1: Running ChatGPT Planner');
    const plannerResponse = await supabaseAdmin.functions.invoke('chatgpt-planner', {
      body: { prompt, workflow_id: workflowId }
    });

    if (plannerResponse.error) {
      throw new Error(`Planner failed: ${plannerResponse.error.message}`);
    }

    const plannerResult = plannerResponse.data;

    // Step 2: Claude Refiner
    console.log('Step 2: Running Claude Refiner');
    const refinerResponse = await supabaseAdmin.functions.invoke('claude-refiner', {
      body: { plan: plannerResult.plan, workflow_id: workflowId }
    });

    if (refinerResponse.error) {
      throw new Error(`Refiner failed: ${refinerResponse.error.message}`);
    }

    const refinerResult = refinerResponse.data;

    // Step 3: DeepSeek Optimizer
    console.log('Step 3: Running DeepSeek Optimizer');
    const optimizerResponse = await supabaseAdmin.functions.invoke('deepseek-optimizer', {
      body: { refined_plan: refinerResult.refined_plan, workflow_id: workflowId }
    });

    if (optimizerResponse.error) {
      throw new Error(`Optimizer failed: ${optimizerResponse.error.message}`);
    }

    const optimizerResult = optimizerResponse.data;

    // Step 4: N8n Assistant
    console.log('Step 4: Running N8n Assistant');
    const assistantResponse = await supabaseAdmin.functions.invoke('n8n-assistant', {
      body: { 
        optimized_spec: optimizerResult.optimized_specification, 
        workflow_id: workflowId,
        dry_run 
      }
    });

    if (assistantResponse.error) {
      throw new Error(`N8n Assistant failed: ${assistantResponse.error.message}`);
    }

    const finalWorkflow = assistantResponse.data.workflow_json;

    // Validate the final workflow
    const validationResponse = await supabaseAdmin.functions.invoke('validate-workflow', {
      body: { workflow_json: finalWorkflow, workflow_id: workflowId }
    });

    if (validationResponse.error) {
      console.error('Validation failed:', validationResponse.error);
      
      // Update workflow with validation errors
      await supabaseAdmin
        .from('workflows')
        .update({
          status: 'validation_failed',
          validation_errors: validationResponse.error
        })
        .eq('id', workflowId);

      return new Response(JSON.stringify({
        success: false,
        workflow_id: workflowId,
        error: 'Workflow validation failed',
        validation_errors: validationResponse.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to automations table
    await supabaseAdmin
      .from('automations')
      .insert({
        user_id: authenticatedUserId,
        prompt: prompt,
        workflow_json: finalWorkflow,
        title: `Automation: ${prompt.substring(0, 50)}...`,
        status: dry_run ? 'dry_run_complete' : 'completed'
      });

    // Update workflow with final result
    await supabaseAdmin
      .from('workflows')
      .update({
        workflow_json: finalWorkflow,
        status: dry_run ? 'dry_run_complete' : 'completed'
      })
      .eq('id', workflowId);

    console.log(`Orchestration completed successfully for workflow ${workflowId}`);

    return new Response(JSON.stringify({
      success: true,
      workflow_id: workflowId,
      workflow_json: finalWorkflow,
      execution_summary: {
        planner_result: plannerResult,
        refiner_result: refinerResult,
        optimizer_result: optimizerResult,
        validation_result: validationResponse.data
      },
      dry_run
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});