import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface WorkflowData {
  name: string
  nodes: any[]
  connections: any
  active?: boolean
  settings?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { workflow } = await req.json()

    if (!workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get n8n configuration from environment variables
    const n8nUrl = Deno.env.get('N8N_URL')
    const n8nToken = Deno.env.get('N8N_API_TOKEN')

    if (!n8nUrl || !n8nToken) {
      return new Response(
        JSON.stringify({ error: 'N8N configuration not found. Please configure N8N_URL and N8N_API_TOKEN in Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare workflow data for n8n
    const workflowData: WorkflowData = {
      name: workflow.name || `Automatización ${new Date().toLocaleDateString()}`,
      nodes: workflow.nodes || [],
      connections: workflow.connections || {},
      active: true,
      settings: workflow.settings || {}
    }

    // Send workflow to n8n
    const response = await fetch(`${n8nUrl}/rest/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8nToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N API Error:', response.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Error al crear workflow en n8n: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        workflowId: result.id,
        message: 'Automatización creada y activada en tu cuenta de n8n',
        workflowName: workflowData.name
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-to-n8n function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})