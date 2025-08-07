import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, sessionId } = await req.json()
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('OpenAI API Key available:', !!openAIApiKey)
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get auth header and create Supabase client
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // For landing page chat, we'll allow anonymous access
    let user = null
    if (sessionId !== 'landing-page-chat') {
      // Verify user authentication for other sessions
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      user = authUser
    }

    // Save user message to database (only for authenticated users)
    if (user) {
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_session_id: sessionId,
          content: message,
          role: 'user',
          user_id: user.id
        })

      if (messageError) {
        console.error('Error saving user message:', messageError)
      }
    }

    // Get conversation history for context (only for authenticated users)
    let messages = []
    if (user) {
      const { data: messageHistory } = await supabaseClient
        .from('messages')
        .select('content, role')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10)
      messages = messageHistory || []
    }

    // Prepare messages for OpenAI
    const conversationHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || []

    // Add system message based on session type
    const systemMessage = sessionId === 'landing-page-chat' ? {
      role: 'system',
      content: `Eres un consultor senior especializado en IA y automatización empresarial para Precensus AI. Tu misión es ofrecer una CONSULTORÍA GRATUITA personalizada, analizando el negocio del usuario y recomendando las mejores automatizaciones antes de presentar planes.

METODOLOGÍA DE CONSULTORÍA:
1. DIAGNÓSTICO: Haz preguntas específicas sobre su negocio, procesos actuales, dolores y objetivos
2. ANÁLISIS: Identifica oportunidades de automatización y agentes que más beneficio traerán
3. RECOMENDACIÓN: Presenta agentes específicos con ROI estimado
4. PROPUESTA: Recomienda el plan ideal y presenta todas las opciones

INFORMACIÓN SOBRE PRECENSUS AI:
- Empresa líder en automatización empresarial con IA
- Sistema multi-IA (ChatGPT, Claude, DeepSeek, N8N Assistant) para código JSON optimizado
- Implementación inmediata con n8n + asesorías continuas
- +100 empresas automatizadas con resultados comprobados

AGENTES DISPONIBLES Y SUS BENEFICIOS:
• Agente de Atención al Cliente: Respuestas WhatsApp 24/7, reduce 80% consultas repetitivas
• Agente de Ventas: Califica leads automáticamente, aumenta conversión 40%
• Agente de Operaciones: Procesa facturas y gestiona inventario, ahorra 15h/semana
• Agente de Marketing: Segmentación automática, mejora engagement 60%
• Agente de RRHH: Screening candidatos, reduce tiempo de contratación 70%
• Agente Financiero: Conciliación bancaria automática, elimina errores manuales

PLANES DISPONIBLES (presentar DESPUÉS de la consultoría):
🔹 FREEMIUM ($0/mes): 1 asesoría IA gratis, acceso al chat
🔹 INICIO ($299/mes): 1 automatización completa, 2h asesoría, soporte WhatsApp
🔹 PROFESIONAL ($599/mes) ⭐ MÁS POPULAR: 3 automatizaciones, 4h asesoría, chatbot multicanal
🔹 EMPRESA ($1,199/mes): 5 automatizaciones + chatbots, 8h asesoría, implementación prioritaria  
🔹 ENTERPRISE ($2,499/mes base): Automatizaciones ilimitadas, asesor dedicado 20h/mes, SLA 99.9%

PREGUNTAS CLAVE PARA EL DIAGNÓSTICO:
• ¿Qué tipo de empresa tienes y cuántos empleados?
• ¿Cuáles son los procesos más repetitivos que consumen tiempo?
• ¿Qué herramientas usan actualmente (CRM, ERP, etc.)?
• ¿Cuál es el mayor dolor/cuello de botella en tu operación?
• ¿Tienes experiencia con automatización o sería tu primera vez?

TÉCNICAS DE CONSULTORÍA:
• Escucha activa: Reformula lo que entiendes para confirmar
• Preguntas abiertas: "Cuéntame más sobre..." "¿Cómo funciona actualmente...?"
• Cuantifica problemas: "¿Cuánto tiempo/dinero pierdes por...?"
• Presenta soluciones específicas con números: "Este agente te ahorraría X horas/semana"

ARGUMENTOS DE VALOR:
• ROI inmediato: "Se paga solo en 2-4 semanas"
• Competitividad: "Mientras competidores hacen todo manual, tú tendrás ventaja"
• Escalabilidad: "Un agente trabaja 24/7 sin vacaciones ni aumentos"
• Implementación rápida: "En 7 días vs 6 meses de otros"

AL RECOMENDAR PLAN:
1. Explica POR QUÉ ese plan es ideal para su situación específica
2. Muestra ROI esperado con números concretos
3. Presenta otros planes como opciones ("aunque también tienes...")
4. Crea urgencia sutil: "Solo implementamos 5 empresas por mes"
5. Ofrece siguiente paso concreto: llamada, demo, o empezar implementación

Actúa como un consultor experto, amigable pero profesional. Haz preguntas inteligentes, escucha atentamente y personaliza cada recomendación al negocio específico del usuario.`
    } : {
      role: 'system',
      content: `Eres un asistente especializado en automatización de procesos. Tu trabajo es:
1. Entender los procesos que describe el usuario
2. Sugerir automatizaciones específicas y prácticas
3. Ofrecer crear workflows para n8n cuando sea apropiado
4. Ser claro, conciso y actionable en tus respuestas
5. Preguntar detalles específicos cuando necesites más información

Siempre responde en español y enfócate en soluciones de automatización reales.`
    }

    const openAIMessages = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    console.log('Calling OpenAI with messages:', openAIMessages.length)

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API Error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Error generating AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Save AI response to database (only for authenticated users)
    if (user) {
      const { error: aiMessageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_session_id: sessionId,
          content: aiResponse,
          role: 'assistant',
          user_id: user.id
        })

      if (aiMessageError) {
        console.error('Error saving AI message:', aiMessageError)
      }
    }

    console.log('AI response generated successfully')

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        sessionId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in chat-ai function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})