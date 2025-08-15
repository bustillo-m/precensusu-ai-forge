import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const OPTIMIZER_PROMPT = `You are a DeepSeek Optimizer for n8n workflows. Your role is to take the refined plan and optimize it for maximum efficiency, scalability, and maintainability.

INSTRUCTIONS:
1. Analyze the refined plan for optimization opportunities
2. Apply advanced performance optimizations
3. Implement sophisticated error handling patterns
4. Optimize for scalability and resource usage
5. Add comprehensive monitoring and analytics
6. Prepare for production deployment

INPUT: Refined JSON plan from Claude
OUTPUT: Highly optimized workflow specification

OPTIMIZATION FOCUS AREAS:

1. **Performance Optimization**:
   - Parallel execution strategies
   - Batch processing optimization
   - Memory and CPU efficiency
   - Network call optimization

2. **Scalability**:
   - Queue management
   - Rate limiting strategies
   - Load balancing considerations
   - Resource scaling patterns

3. **Reliability**:
   - Circuit breaker patterns
   - Exponential backoff retry
   - Dead letter queue handling
   - Health check mechanisms

4. **Monitoring & Analytics**:
   - Performance metrics collection
   - Error tracking and alerting
   - Usage analytics
   - Cost optimization tracking

5. **Production Readiness**:
   - Environment configuration
   - Security hardening
   - Compliance considerations
   - Deployment automation

OUTPUT FORMAT:
{
  "workflow_specification": {
    "name": "Optimized workflow name",
    "description": "Comprehensive workflow description",
    "category": "Final category",
    "tags": ["workflow", "tags"],
    "version": "1.0.0"
  },
  "execution_strategy": {
    "mode": "synchronous|asynchronous|hybrid",
    "parallelization": "Parallel execution plan",
    "resource_allocation": "Resource requirements",
    "scaling_strategy": "How to handle load"
  },
  "node_specifications": [
    {
      "node_id": "unique_identifier",
      "name": "Node name",
      "type": "n8n node type",
      "position": [x, y],
      "parameters": "Detailed configuration",
      "retry_strategy": "Retry configuration",
      "timeout": "Timeout settings",
      "monitoring": "Monitoring configuration"
    }
  ],
  "connection_map": "Optimized node connections",
  "error_handling": {
    "global_error_handler": "Global error handling strategy",
    "node_specific_handlers": "Per-node error handling",
    "notification_strategy": "Error notification plan"
  },
  "performance_optimizations": ["List of applied optimizations"],
  "security_measures": ["Security implementations"],
  "production_checklist": ["Deployment readiness items"]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const { refined_plan } = await req.json();
    
    if (!refined_plan) {
      return new Response(JSON.stringify({ error: 'Refined plan is required for optimization' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('DeepSeek Optimizer: Optimizing plan for objective:', refined_plan.refined_plan?.objective || 'Unknown');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
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
            content: OPTIMIZER_PROMPT 
          },
          { 
            role: 'user', 
            content: `Please optimize this refined workflow plan:\n\n${JSON.stringify(refined_plan, null, 2)}` 
          }
        ],
        max_tokens: 2500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const optimizedText = data.choices[0].message.content;
    
    let optimizedSpec;
    try {
      // Clean up JSON if wrapped in markdown
      let cleanOptimizedText = optimizedText;
      if (optimizedText.includes('```json')) {
        cleanOptimizedText = optimizedText.split('```json')[1].split('```')[0];
      } else if (optimizedText.includes('```')) {
        cleanOptimizedText = optimizedText.split('```')[1];
      }
      
      optimizedSpec = JSON.parse(cleanOptimizedText.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', optimizedText);
      throw new Error('Failed to parse optimized specification JSON from DeepSeek response');
    }

    console.log('DeepSeek Optimizer: Specification optimized successfully');

    return new Response(JSON.stringify({
      success: true,
      optimized_specification: optimizedSpec,
      source: 'deepseek-optimizer'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('DeepSeek Optimizer error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'deepseek-optimizer'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});