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

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save user message to database
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

    // Get conversation history for context
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('content, role')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Prepare messages for OpenAI
    const conversationHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || []

    // Add system message for automation context
    const systemMessage = {
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

    // Save AI response to database
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