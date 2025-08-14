import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const leadsToEmail = Deno.env.get('LEADS_TO_EMAIL')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

interface CredentialRequest {
  service: string
  api_key_name: string
  workflow_id?: string
  step?: string
  message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { service, api_key_name, workflow_id, step, message }: CredentialRequest = await req.json()

    // Check if the API key already exists
    const keyExists = Deno.env.get(api_key_name)
    
    if (keyExists) {
      console.log(`API key ${api_key_name} is already configured`)
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'API key is already configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailSubject = `🔑 Credenciales faltantes para ${service}`
    const emailBody = `
    <h2>Faltan credenciales para completar la operación</h2>
    
    <p><strong>Servicio:</strong> ${service}</p>
    <p><strong>Variable requerida:</strong> ${api_key_name}</p>
    ${workflow_id ? `<p><strong>Workflow ID:</strong> ${workflow_id}</p>` : ''}
    ${step ? `<p><strong>Paso:</strong> ${step}</p>` : ''}
    
    <p><strong>Mensaje:</strong> ${message || 'Se requiere configurar la API key para continuar con la automatización.'}</p>
    
    <hr>
    
    <h3>Instrucciones:</h3>
    <ol>
      <li>Ve a la configuración de Supabase Edge Functions</li>
      <li>Agrega la variable de entorno: <code>${api_key_name}</code></li>
      <li>Reinicia las funciones edge para aplicar los cambios</li>
    </ol>
    
    <p><a href="https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/settings/functions">Configurar credenciales en Supabase</a></p>
    
    <br>
    <p><em>Este mensaje se generó automáticamente desde el sistema de automatización.</em></p>
    `

    // Send email using the send-lead function
    const { error: emailError } = await supabase.functions.invoke('send-lead', {
      body: {
        to: leadsToEmail,
        subject: emailSubject,
        html: emailBody,
        metadata: {
          type: 'credential_request',
          service,
          api_key_name,
          workflow_id,
          step
        }
      }
    })

    if (emailError) {
      console.error('Failed to send credential request email:', emailError)
      return new Response(JSON.stringify({ 
        error: 'Failed to send credential request email',
        details: emailError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Credential request sent for ${service} (${api_key_name})`)

    return new Response(JSON.stringify({
      success: true,
      message: `Credential request sent for ${service}. Email notification dispatched.`,
      service,
      api_key_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in request-credentials function:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})