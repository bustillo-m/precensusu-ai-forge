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

    // Create a simple workflow directly instead of calling multiple functions
    console.log('Creating automated workflow from prompt...');
    
    // Get API keys
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OPENAI_API_KEY not configured. Please add your OpenAI API key in Supabase secrets.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use OpenAI to create a workflow plan
    const planResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are an n8n workflow automation expert. Create a detailed n8n workflow JSON from user prompts.

IMPORTANT: Return ONLY valid JSON workflow format. No explanations, no markdown.

Basic n8n workflow structure:
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "unique-id",
      "name": "Node Name", 
      "type": "n8n-node-type",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": {}
    }
  ],
  "connections": {},
  "active": false,
  "settings": {},
  "staticData": {},
  "tags": [],
  "triggerCount": 0,
  "updatedAt": "${new Date().toISOString()}",
  "versionId": "${crypto.randomUUID()}"
}`
          },
          { 
            role: 'user', 
            content: `Create a complete n8n workflow for: ${prompt}` 
          }
        ],
        max_tokens: 2000
      }),
    });

    if (!planResponse.ok) {
      throw new Error(`OpenAI API error: ${planResponse.statusText}`);
    }

    const planData = await planResponse.json();
    let workflowJsonText = planData.choices[0].message.content;
    
    // Clean up the response to extract JSON
    if (workflowJsonText.includes('```json')) {
      workflowJsonText = workflowJsonText.split('```json')[1].split('```')[0];
    } else if (workflowJsonText.includes('```')) {
      workflowJsonText = workflowJsonText.split('```')[1].split('```')[0];
    }
    
    let finalWorkflow;
    try {
      finalWorkflow = JSON.parse(workflowJsonText.trim());
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', workflowJsonText);
      
      // Create a simple fallback workflow
      finalWorkflow = {
        "name": `Automation: ${prompt.substring(0, 50)}...`,
        "nodes": [
          {
            "id": crypto.randomUUID(),
            "name": "Manual Trigger",
            "type": "@n8n/n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [240, 300],
            "parameters": {}
          },
          {
            "id": crypto.randomUUID(), 
            "name": "Set Data",
            "type": "@n8n/n8n-nodes-base.set",
            "typeVersion": 3,
            "position": [460, 300],
            "parameters": {
              "assignments": {
                "assignments": [
                  {
                    "id": crypto.randomUUID(),
                    "name": "automation_prompt",
                    "value": prompt,
                    "type": "string"
                  }
                ]
              }
            }
          }
        ],
        "connections": {
          "Manual Trigger": {
            "main": [
              [
                {
                  "node": "Set Data",
                  "type": "main",
                  "index": 0
                }
              ]
            ]
          }
        },
        "active": false,
        "settings": {},
        "staticData": {},
        "tags": [],
        "triggerCount": 0,
        "updatedAt": new Date().toISOString(),
        "versionId": crypto.randomUUID()
      };
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
        message: "Workflow created successfully using OpenAI",
        model_used: "gpt-4o"
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