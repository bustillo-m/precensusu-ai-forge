import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const REFINER_PROMPT = `You are a Claude Refiner for n8n workflow optimization. Your role is to take a workflow plan from ChatGPT and refine it for better efficiency, security, and maintainability.

INSTRUCTIONS:
1. Review the incoming JSON plan from ChatGPT Planner
2. Optimize structure and flow for better performance
3. Add comprehensive error handling strategies
4. Implement security best practices and validation
5. Enhance with monitoring and logging capabilities
6. Output a refined and optimized JSON plan

INPUT: JSON plan from ChatGPT Planner
OUTPUT: Refined JSON plan with improvements

REFINEMENT AREAS:

1. **Structure Optimization**:
   - Improve workflow organization and node arrangement
   - Optimize data flow between steps
   - Reduce redundancy and improve efficiency
   - Add parallel processing where possible

2. **Error Handling**:
   - Add try-catch blocks and error workflows
   - Implement retry mechanisms for API calls
   - Add fallback strategies for critical failures
   - Include validation checkpoints

3. **Security & Validation**:
   - Add input sanitization and validation
   - Implement proper credential management
   - Add rate limiting and API quota management
   - Include security headers and authentication

4. **Performance**:
   - Optimize API call patterns
   - Add caching strategies where appropriate
   - Implement batch processing for bulk operations
   - Add timeout configurations

5. **Best Practices**:
   - Add comprehensive logging and monitoring
   - Include proper documentation in nodes
   - Add metadata and tagging for organization
   - Implement proper testing strategies

OUTPUT FORMAT:
{
  "refined_plan": {
    "objective": "Enhanced objective description",
    "category": "Refined category",
    "subcategory": "Refined subcategory",
    "trigger": {
      "type": "Optimized trigger type",
      "description": "Enhanced trigger description",
      "configuration": "Additional trigger settings"
    },
    "workflow_steps": [
      {
        "step": 1,
        "action": "Enhanced action description",
        "node_type": "Specific n8n node type",
        "configuration": "Detailed node configuration",
        "error_handling": "Error handling strategy",
        "validation": "Input/output validation rules"
      }
    ],
    "integrations": "Detailed integration requirements",
    "data_flow": "Optimized data flow description",
    "error_handling": "Global error handling strategy",
    "monitoring": "Monitoring and logging strategy",
    "security": "Security implementation details"
  },
  "optimization_notes": ["List of improvements made"],
  "complexity": "Updated complexity rating",
  "estimated_execution_time": "Estimated runtime"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const { plan } = await req.json();
    
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan is required for refinement' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Claude Refiner: Refining plan for objective:', plan.objective);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${REFINER_PROMPT}\n\nPlease refine this workflow plan:\n\n${JSON.stringify(plan, null, 2)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const refinedText = data.content[0].text;
    
    let refinedPlan;
    try {
      // Clean up JSON if wrapped in markdown
      let cleanRefinedText = refinedText;
      if (refinedText.includes('```json')) {
        cleanRefinedText = refinedText.split('```json')[1].split('```')[0];
      } else if (refinedText.includes('```')) {
        cleanRefinedText = refinedText.split('```')[1];
      }
      
      refinedPlan = JSON.parse(cleanRefinedText.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', refinedText);
      throw new Error('Failed to parse refined plan JSON from Claude response');
    }

    console.log('Claude Refiner: Plan refined successfully');

    return new Response(JSON.stringify({
      success: true,
      refined_plan: refinedPlan,
      source: 'claude-refiner'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Claude Refiner error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'claude-refiner'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});