import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const n8nApiKey = Deno.env.get('N8N_ASSISTANT_API_KEY');

const FINALIZER_PROMPT = `You are the N8n Assistant Finalizer. Your role is to transform the optimized workflow specification into a complete, valid n8n workflow JSON that can be directly imported into n8n.

INSTRUCTIONS:
1. Convert the optimized specification into valid n8n JSON format
2. Generate proper UUIDs for all nodes
3. Create correct node connections and data flow
4. Add required logging and error handling nodes
5. Validate against n8n workflow schema
6. Ensure all credentials and configurations are properly formatted

INPUT: Optimized workflow specification from DeepSeek
OUTPUT: Complete n8n workflow JSON ready for import

REQUIRED COMPONENTS:
1. **Mandatory Nodes**:
   - Start trigger node
   - Error handler node
   - Logger node for tracking
   - End nodes for all paths

2. **Node Structure**:
   - Valid UUIDs for all node IDs
   - Proper positioning for UI layout
   - Correct parameter formatting
   - Appropriate type versions

3. **Connections**:
   - Valid connection mapping
   - Error path connections
   - Success path connections
   - Proper output routing

4. **Validation Requirements**:
   - Schema compliance
   - Node parameter validation
   - Connection integrity
   - Credential reference validation

TEMPLATE STRUCTURE:
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "uuid-string",
      "name": "Node Name",
      "type": "n8n-node-type",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": {},
      "credentials": {}
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
  "updatedAt": "timestamp",
  "versionId": "uuid"
}

QUALITY ASSURANCE:
- All nodes must have valid types and parameters
- Connections must reference existing node IDs
- Credentials must follow n8n naming conventions
- Error handling must be comprehensive
- Logging must capture key workflow events
- Schema validation must pass completely

OUTPUT: Complete n8n workflow JSON that imports without errors and executes successfully.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!n8nApiKey) {
      throw new Error('N8N_ASSISTANT_API_KEY not configured');
    }

    const { optimized_specification } = await req.json();
    
    if (!optimized_specification) {
      return new Response(JSON.stringify({ error: 'Optimized specification is required for finalization' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('N8N Assistant: Finalizing workflow for specification:', optimized_specification.workflow_specification?.name || 'Unknown');

    // Use OpenAI with n8n-specific prompt for better n8n workflow generation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: FINALIZER_PROMPT 
          },
          { 
            role: 'user', 
            content: `Please create a complete n8n workflow JSON from this optimized specification:\n\n${JSON.stringify(optimized_specification, null, 2)}` 
          }
        ],
        max_tokens: 3000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`N8N Assistant API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let workflowText = data.choices[0].message.content;
    
    // Clean up the response to extract JSON
    if (workflowText.includes('```json')) {
      workflowText = workflowText.split('```json')[1].split('```')[0];
    } else if (workflowText.includes('```')) {
      workflowText = workflowText.split('```')[1];
    }
    
    let finalWorkflow;
    try {
      finalWorkflow = JSON.parse(workflowText.trim());
      
      // Ensure required fields are present
      if (!finalWorkflow.name) {
        finalWorkflow.name = optimized_specification.workflow_specification?.name || "Generated Workflow";
      }
      
      if (!finalWorkflow.versionId) {
        finalWorkflow.versionId = crypto.randomUUID();
      }
      
      if (!finalWorkflow.updatedAt) {
        finalWorkflow.updatedAt = new Date().toISOString();
      }
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', workflowText);
      throw new Error('Failed to parse final workflow JSON from N8N Assistant response');
    }

    console.log('N8N Assistant: Workflow finalized successfully');

    return new Response(JSON.stringify({
      success: true,
      workflow: finalWorkflow,
      source: 'n8n-assistant'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('N8N Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'n8n-assistant'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});