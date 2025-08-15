import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const PLANNER_PROMPT = `You are a ChatGPT Planner for n8n workflow automation. Your role is to analyze user requests and create a structured plan for automation workflows.

INSTRUCTIONS:
1. Analyze the user's request and identify the main automation objective
2. Break down the process into logical steps
3. Identify required integrations and APIs
4. Define trigger conditions and workflow flow
5. Consider error handling and validation needs
6. Output a structured JSON plan

OUTPUT FORMAT:
{
  "objective": "Brief description of what this automation accomplishes",
  "category": "marketing_agencies|sales|operations|customer_service",
  "subcategory": "videos|blogs|images|linkedin|agents|email|crm",
  "trigger": {
    "type": "manual|webhook|schedule|poll",
    "description": "How the workflow starts"
  },
  "steps": [
    {
      "step": 1,
      "action": "Description of what happens",
      "integration": "Service or tool needed",
      "inputs": ["required data"],
      "outputs": ["produced data"]
    }
  ],
  "integrations_needed": ["List of services/APIs required"],
  "complexity": "low|medium|high",
  "estimated_nodes": "Number estimate",
  "requirements": ["Special considerations or requirements"]
}

GUIDELINES:
- Focus on marketing agency workflows (video creation, blog posts, social media, branding)
- Consider scalability and efficiency
- Include proper error handling in complex workflows
- Suggest specific n8n nodes when possible
- Think about data validation and logging needs`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('ChatGPT Planner: Creating plan for prompt:', prompt.substring(0, 100));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: PLANNER_PROMPT },
          { role: 'user', content: `Create a detailed automation plan for: ${prompt}` }
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const planText = data.choices[0].message.content;
    
    let plan;
    try {
      // Clean up JSON if wrapped in markdown
      let cleanPlanText = planText;
      if (planText.includes('```json')) {
        cleanPlanText = planText.split('```json')[1].split('```')[0];
      } else if (planText.includes('```')) {
        cleanPlanText = planText.split('```')[1];
      }
      
      plan = JSON.parse(cleanPlanText.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', planText);
      throw new Error('Failed to parse plan JSON from ChatGPT response');
    }

    console.log('ChatGPT Planner: Plan created successfully');

    return new Response(JSON.stringify({
      success: true,
      plan,
      source: 'chatgpt-planner'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ChatGPT Planner error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'chatgpt-planner'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});