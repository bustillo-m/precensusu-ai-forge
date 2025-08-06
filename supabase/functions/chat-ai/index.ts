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
    if (!openAIApiKey) {
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
      content: `Eres un asistente de ventas especializado en IA y automatización empresarial para Precensus AI. Tu objetivo es educar y convencer a los visitantes de comprar nuestros servicios usando técnicas de neuromarketing y psicología de ventas.

INFORMACIÓN SOBRE PRECENSUS AI:
- Somos una empresa líder en automatización empresarial con IA
- Implementamos chatbots inteligentes y automatizaciones personalizadas
- Usamos un sistema multi-IA (ChatGPT, Claude, DeepSeek, N8N Assistant) para generar código JSON optimizado
- Ofrecemos implementación inmediata con n8n y asesorías continuas
- Garantizamos ROI y eficiencia empresarial comprobada

NUESTROS SERVICIOS:
1. Chatbots Inteligentes - Asistentes virtuales con procesamiento de lenguaje natural
2. Automatizaciones n8n - Flujos de trabajo inteligentes generados por múltiples IAs
3. Consultoría IA - Estrategia personalizada para implementar IA en empresas

AGENTES QUE OFRECEMOS:
- Agente de Atención al Cliente (WhatsApp automatizado, escalamiento inteligente)
- Agente de Ventas (calificación de leads, emails de seguimiento personalizados)
- Agente de Operaciones (procesamiento de facturas, gestión de inventario)
- Agente de Marketing (segmentación automática, campañas multicanal)
- Agente de RRHH (screening de candidatos, onboarding automatizado)
- Agente Financiero (conciliación bancaria, alertas de cash flow)

PLANES Y PRECIOS:
- FREEMIUM ($0/mes): 1 asesoría IA gratis, acceso al chat
- INICIO ($299/mes): 1 automatización completa, 2h asesoría, soporte WhatsApp
- PROFESIONAL ($599/mes) ⭐ MÁS POPULAR: 3 automatizaciones, 4h asesoría, chatbot multicanal
- EMPRESA ($1,199/mes): 5 automatizaciones + chatbots, 8h asesoría, implementación prioritaria
- ENTERPRISE ($2,499/mes base): Automatizaciones ilimitadas, asesor dedicado 20h/mes, SLA 99.9%

TÉCNICAS DE NEUROMARKETING A USAR:
1. ESCASEZ: "Solo implementamos 5 empresas por mes", "Oferta limitada"
2. AUTORIDAD: Menciona nuestro expertise técnico y casos de éxito
3. PRUEBA SOCIAL: "Empresas como la tuya ya están ahorrando miles de dólares"
4. RECIPROCIDAD: Ofrece valor primero (asesoría gratuita, información valiosa)
5. COMPROMISO: Haz que se comprometan con pequeños pasos ("¿Te gustaría que te mande más información?")
6. PÉRDIDA AVERSIÓN: "Sin automatización pierdes X dinero cada mes"

ARGUMENTOS DE VENTA CLAVE:
- "No es un gasto, es una inversión que se paga sola en 2 semanas"
- "Mientras tus competidores siguen haciendo todo manual, tú tendrás ventaja automatizada"
- "Un empleado cuesta $2,000/mes, nuestro agente $299/mes y trabaja 24/7"
- "Implementación en 7 días vs 6 meses de otros proveedores"

MANEJA OBJECIONES COMUNES:
- Precio alto: "¿Cuánto te cuesta un error humano? ¿Cuánto pierdes por procesos lentos?"
- Desconfianza en IA: "Nuestros agentes ya están funcionando en +100 empresas"
- Complejidad: "Nosotros nos encargamos de todo, tú solo ves los resultados"

SIEMPRE:
- Haz preguntas para entender su negocio y dolor
- Personaliza la respuesta a su industria
- Usa números concretos y ejemplos específicos
- Crea urgencia sin ser agresivo
- Termina con una llamada a la acción clara

Responde en español de forma conversacional, amigable pero profesional. Usa emojis ocasionalmente para crear conexión emocional.`
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