import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const TO_EMAIL = Deno.env.get("LEADS_TO_EMAIL") || "u1974564828@gmail.com";

interface CredentialRequest {
  service: string;
  api_key_name: string;
  workflow_id: string;
  step: string;
  user_email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { service, api_key_name, workflow_id, step, user_email }: CredentialRequest = await req.json();

    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const timestamp = new Date().toISOString();
    const requestId = `cred_req_${Date.now()}`;

    // Email to admin requesting credentials
    await resend.emails.send({
      from: "Precensusu AI <no-reply@resend.dev>",
      to: [TO_EMAIL],
      subject: `🔑 Credencial requerida: ${service}`,
      html: `
        <h2>Solicitud de Credencial API</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Servicio:</strong> ${service}</p>
          <p><strong>Variable requerida:</strong> ${api_key_name}</p>
          <p><strong>Workflow ID:</strong> ${workflow_id}</p>
          <p><strong>Paso del pipeline:</strong> ${step}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
        </div>
        
        <h3>Instrucciones para configurar:</h3>
        <ol>
          <li>Ve a <a href="https://supabase.com/dashboard/project/bopunplxayuvcvrmsjhq/settings/functions">Supabase Edge Functions Secrets</a></li>
          <li>Añade una nueva variable con nombre: <code>${api_key_name}</code></li>
          <li>Introduce la clave API de ${service}</li>
          <li>Reinicia las funciones edge para aplicar los cambios</li>
        </ol>
        
        <h3>Detalles del servicio:</h3>
        ${getServiceInstructions(service)}
        
        <p><em>Una vez configurado, el pipeline podrá continuar automáticamente.</em></p>
      `,
    });

    // Optional: Email to user if provided
    if (user_email) {
      await resend.emails.send({
        from: "Precensusu AI <no-reply@resend.dev>",
        to: [user_email],
        subject: "⏳ Tu automatización está en espera",
        html: `
          <h2>Automatización en proceso</h2>
          <p>Hola,</p>
          <p>Tu solicitud de automatización está siendo procesada, pero necesitamos configurar algunas credenciales de API para completar el proceso.</p>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Workflow ID:</strong> ${workflow_id}</p>
            <p><strong>Estado:</strong> Esperando configuración de ${service}</p>
          </div>
          
          <p>Nos pondremos en contacto contigo una vez que el workflow esté listo.</p>
          
          <p>— Equipo Precensusu AI</p>
        `,
      });
    }

    console.log(`Credential request sent for ${service} (${api_key_name})`);

    return new Response(JSON.stringify({ 
      success: true,
      request_id: requestId,
      service,
      api_key_name,
      message: "Credential request sent to administrator"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (e) {
    console.error("request-credentials error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function getServiceInstructions(service: string): string {
  switch (service) {
    case 'OpenAI':
      return `
        <p><strong>OpenAI API Key:</strong></p>
        <ul>
          <li>Ve a <a href="https://platform.openai.com/api-keys">OpenAI API Keys</a></li>
          <li>Crea una nueva clave API</li>
          <li>Asegúrate de tener créditos disponibles en tu cuenta</li>
        </ul>
      `;
    case 'Anthropic':
      return `
        <p><strong>Anthropic API Key:</strong></p>
        <ul>
          <li>Ve a <a href="https://console.anthropic.com/settings/keys">Anthropic Console</a></li>
          <li>Genera una nueva clave API</li>
          <li>Verifica que tienes acceso a Claude Sonnet 4</li>
        </ul>
      `;
    case 'DeepSeek':
      return `
        <p><strong>DeepSeek API Key:</strong></p>
        <ul>
          <li>Ve a <a href="https://platform.deepseek.com/api_keys">DeepSeek Platform</a></li>
          <li>Crea una nueva clave API</li>
          <li>Confirma que tienes acceso al modelo deepseek-chat</li>
        </ul>
      `;
    case 'N8n Assistant':
      return `
        <p><strong>N8n Assistant API Key:</strong></p>
        <ul>
          <li>Este es un servicio personalizado para generar workflows de n8n</li>
          <li>Contacta al administrador para obtener acceso</li>
          <li>El sistema puede funcionar sin esta clave usando generación básica</li>
        </ul>
      `;
    default:
      return `<p>Consulta la documentación del servicio <strong>${service}</strong> para obtener instrucciones específicas.</p>`;
  }
}