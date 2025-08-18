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

    // Multi-AI orchestration workflow
    console.log('Starting multi-AI orchestration workflow...');
    
    try {
      // Step 1: ChatGPT Planning
      console.log('Step 1: Creating initial plan with ChatGPT...');
      const planResponse = await supabaseAdmin.functions.invoke('chatgpt-planner', {
        body: { prompt }
      });
      
      if (planResponse.error) {
        throw new Error(`ChatGPT Planner failed: ${planResponse.error.message}`);
      }
      
      const planData = planResponse.data;
      console.log('ChatGPT plan created successfully');

      // Step 2: Claude Refinement
      console.log('Step 2: Refining plan with Claude...');
      const refineResponse = await supabaseAdmin.functions.invoke('claude-refiner', {
        body: { plan: planData.plan }
      });
      
      if (refineResponse.error) {
        throw new Error(`Claude Refiner failed: ${refineResponse.error.message}`);
      }
      
      const refinedData = refineResponse.data;
      console.log('Claude refinement completed successfully');

      // Step 3: DeepSeek Optimization
      console.log('Step 3: Optimizing with DeepSeek...');
      const optimizeResponse = await supabaseAdmin.functions.invoke('deepseek-optimizer', {
        body: { refined_plan: refinedData.refined_plan }
      });
      
      if (optimizeResponse.error) {
        throw new Error(`DeepSeek Optimizer failed: ${optimizeResponse.error.message}`);
      }
      
      const optimizedData = optimizeResponse.data;
      console.log('DeepSeek optimization completed successfully');

      // Step 4: N8N Assistant Finalization
      console.log('Step 4: Creating final n8n workflow...');
      const finalizeResponse = await supabaseAdmin.functions.invoke('n8n-assistant', {
        body: { optimized_specification: optimizedData.optimized_specification }
      });
      
      if (finalizeResponse.error) {
        throw new Error(`N8N Assistant failed: ${finalizeResponse.error.message}`);
      }
      
      const finalData = finalizeResponse.data;
      console.log('N8N workflow finalization completed successfully');

      // Step 5: Workflow Validation
      console.log('Step 5: Validating final workflow...');
      const validateResponse = await supabaseAdmin.functions.invoke('validate-workflow', {
        body: { workflow: finalData.workflow }
      });
      
      if (validateResponse.error) {
        console.warn('Validation failed, but continuing with workflow:', validateResponse.error.message);
      }
      
      const validationData = validateResponse.data;
      const finalWorkflow = finalData.workflow;
      
      console.log('Multi-AI orchestration completed successfully');

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
          message: "Workflow created successfully using multi-AI orchestration",
          models_used: ["ChatGPT", "Claude", "DeepSeek", "N8N-Assistant"]
        },
        dry_run
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (orchestrationError) {
      console.error('Multi-AI orchestration failed:', orchestrationError);
      
      // Update workflow status to failed
      await supabaseAdmin
        .from('workflows')
        .update({
          status: 'failed',
          validation_errors: { orchestration_error: orchestrationError.message }
        })
        .eq('id', workflowId);
      
      return new Response(JSON.stringify({ 
        error: `Multi-AI orchestration failed: ${orchestrationError.message}`,
        details: 'Check the function logs for more information'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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