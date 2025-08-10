import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const TO_EMAIL = Deno.env.get("LEADS_TO_EMAIL") || "precensus@gmail.com";

interface LeadPayload {
  name: string;
  email: string;
  details?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, details }: LeadPayload = await req.json();

    if (!Deno.env.get("RESEND_API_KEY")) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await resend.emails.send({
      from: "Precensusu AI <no-reply@resend.dev>",
      to: [TO_EMAIL],
      reply_to: email,
      subject: `Nuevo lead: ${name}`,
      html: `<h2>Nuevo lead</h2><p><b>Nombre:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Detalles:</b> ${details || ""}</p>`,
    });

    await resend.emails.send({
      from: "Precensusu AI <no-reply@resend.dev>",
      to: [email],
      subject: "¡Gracias por tu interés!",
      html: `<p>Hola ${name},</p><p>Gracias por contactarnos. En breve te escribiremos para coordinar tu demo.</p><p>— Equipo Precensusu AI</p>`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-lead error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
