import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import sgMail from "@sendgrid/mail";
import { storage } from "./storage";
import { insertUserSchema, insertChatSessionSchema, insertMessageSchema, insertWorkflowSchema, insertAutomationSchema, type User } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// Function to send workflow JSON via email
async function sendWorkflowEmail(workflowJson: any, userEmail: string, userPhone: string, conversationContext: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return;
  }

  // Your company emails - you can change these to your real emails
  const companyEmails = ['admin@precensus.com', 'team@precensus.com'];
  
  const msg = {
    to: companyEmails,
    from: 'noreply@precensus.com', // You'll need to verify this email in SendGrid
    subject: `Nueva automatización generada - Cliente: ${userEmail}`,
    text: `Se ha generado una nueva automatización para el cliente:

Email: ${userEmail}
Teléfono: ${userPhone}

Contexto de la conversación:
${conversationContext}

El archivo JSON está adjunto como attachment.`,
    html: `
      <h2>Nueva Automatización Generada</h2>
      <p><strong>Cliente:</strong> ${userEmail}</p>
      <p><strong>Teléfono:</strong> ${userPhone}</p>
      
      <h3>Contexto de la conversación:</h3>
      <p>${conversationContext.replace(/\n/g, '<br>')}</p>
      
      <p>El archivo JSON de la automatización está adjunto.</p>
      
      <hr>
      <p><em>Este email fue generado automáticamente por Precensus AI</em></p>
    `,
    attachments: [
      {
        content: Buffer.from(JSON.stringify(workflowJson, null, 2)).toString('base64'),
        filename: `workflow-${Date.now()}.json`,
        type: 'application/json',
        disposition: 'attachment'
      }
    ]
  };

  try {
    await sgMail.send(msg);
    console.log('Workflow email sent successfully');
  } catch (error) {
    console.error('Error sending workflow email:', error);
  }
}

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error: any) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password!, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Create profile
      await storage.createProfile({
        userId: user.id,
        username: validatedData.username
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
    const user = req.user;
    res.json({ user: { id: user.id, email: user.email, username: user.username } });
  });

  // Chat Sessions routes
  app.get("/api/chat-sessions", authenticateToken, async (req: any, res: any) => {
    try {
      const sessions = await storage.getChatSessionsByUser(req.user.id);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat-sessions", authenticateToken, async (req: any, res: any) => {
    try {
      const validatedData = insertChatSessionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const session = await storage.createChatSession(validatedData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/chat-sessions/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/chat-sessions/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      await storage.deleteChatSession(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages routes
  app.get("/api/chat-sessions/:sessionId/messages", authenticateToken, async (req: any, res: any) => {
    try {
      const session = await storage.getChatSession(req.params.sessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessagesBySession(req.params.sessionId, limit);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res: any) => {
    try {
      // Verify session belongs to user
      const session = await storage.getChatSession(req.body.chatSessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Workflows routes
  app.get("/api/workflows", authenticateToken, async (req: any, res: any) => {
    try {
      const workflows = await storage.getWorkflowsByUser(req.user.id);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", authenticateToken, async (req: any, res: any) => {
    try {
      const validatedData = insertWorkflowSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const workflow = await storage.createWorkflow(validatedData);
      res.json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow || workflow.userId !== req.user.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/workflows/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow || workflow.userId !== req.user.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const updates = req.body;
      const updatedWorkflow = await storage.updateWorkflow(req.params.id, updates);
      res.json(updatedWorkflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow || workflow.userId !== req.user.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      await storage.deleteWorkflow(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Automations routes
  app.get("/api/automations", authenticateToken, async (req: any, res: any) => {
    try {
      const automations = await storage.getAutomationsByUser(req.user.id);
      res.json(automations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/automations", authenticateToken, async (req: any, res: any) => {
    try {
      const validatedData = insertAutomationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const automation = await storage.createAutomation(validatedData);
      res.json(automation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Check if message triggers workflow creation
  const isWorkflowCreationRequest = (message: string): boolean => {
    const triggers = [
      'crear agente', 'crear automatización', 'crear workflow', 'crear flujo',
      'creame', 'hazme', 'genera', 'construye', 'desarrolla',
      'quiero que crees', 'necesito un agente', 'necesito automatizar',
      'créalo', 'créame', 'hazlo', 'genéralo'
    ];
    
    const lowerMessage = message.toLowerCase();
    return triggers.some(trigger => lowerMessage.includes(trigger));
  };

  // Multi-AI workflow orchestration
  async function orchestrateWorkflowCreation(prompt: string, userId?: string) {
    const steps = [];
    
    try {
      // Step 1: ChatGPT Planner
      steps.push("Iniciando planificación con ChatGPT...");
      const plannerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `Eres un planificador experto de automatizaciones. Tu trabajo es analizar el request del usuario y crear un plan detallado de automatización.

DEBES preguntar específicamente sobre:
1. HERRAMIENTAS DE COMUNICACIÓN: ¿WhatsApp, Telegram, email, SMS?
2. PLATAFORMAS DE INTEGRACIÓN: ¿Facebook, Instagram, LinkedIn, website?
3. ALMACENAMIENTO: ¿Google Drive, Dropbox, servidor local?
4. NOTIFICACIONES: ¿Email, Slack, Discord?
5. DATOS: ¿Hojas de cálculo, bases de datos, CRM específico?

Crea un plan estructurado con:
- Descripción del agente
- Herramientas específicas a usar
- Flujo de trabajo paso a paso
- Integraciones necesarias
- Configuraciones requeridas

Responde en español y sé muy específico sobre las herramientas.`
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      const plannerData = await plannerResponse.json();
      const initialPlan = plannerData.choices[0].message.content;
      steps.push("✅ Plan inicial creado");

      // Step 2: Claude Refiner (si tenemos la API key)
      let refinedPlan = initialPlan;
      if (process.env.ANTHROPIC_API_KEY) {
        steps.push("Refinando con Claude...");
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1500,
            messages: [{
              role: 'user',
              content: `Refina este plan de automatización agregando:
1. Manejo de errores robusto
2. Validaciones de datos
3. Seguridad y permisos
4. Escalabilidad
5. Monitoreo y logs

Plan original:
${initialPlan}

Mejora el plan manteniendo toda la funcionalidad pero haciéndolo más robusto y profesional.`
            }]
          }),
        });

        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json();
          refinedPlan = claudeData.content[0].text;
          steps.push("✅ Plan refinado con Claude");
        }
      }

      // Step 3: DeepSeek Optimizer (simulado por ahora)
      steps.push("Optimizando rendimiento...");
      const optimizedPlan = refinedPlan + "\n\n## OPTIMIZACIONES DE RENDIMIENTO:\n- Caché de respuestas frecuentes\n- Procesamiento asíncrono\n- Rate limiting inteligente\n- Compresión de datos\n- Monitoreo de recursos";
      steps.push("✅ Plan optimizado");

      // Step 4: Generate final JSON
      steps.push("Generando JSON final para n8n...");
      const jsonResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `Eres un experto en n8n que convierte planes de automatización en workflows JSON válidos.

Genera un JSON de n8n que implemente exactamente el plan proporcionado. El JSON debe incluir:
1. Nodos específicos para cada herramienta mencionada
2. Conexiones entre nodos
3. Configuraciones detalladas
4. Webhooks y triggers apropiados
5. Manejo de errores

IMPORTANTE: Genera SOLO el JSON válido para n8n, sin explicaciones adicionales.`
          }, {
            role: 'user',
            content: `Convierte este plan en un workflow JSON de n8n:\n\n${optimizedPlan}`
          }],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      const jsonData = await jsonResponse.json();
      const workflowJson = jsonData.choices[0].message.content;
      steps.push("✅ JSON generado para n8n");

      // Save to database if user is authenticated
      if (userId) {
        const automation = await storage.createAutomation({
          prompt,
          workflowJson: JSON.parse(workflowJson.replace(/```json|```/g, '')),
          userId,
          title: `Automatización generada desde chat`,
          status: 'completed'
        });
        steps.push(`✅ Guardado en base de datos (ID: ${automation.id})`);
      }

      return {
        success: true,
        steps,
        finalPlan: optimizedPlan,
        workflowJson,
        message: "🎉 ¡Workflow creado exitosamente! He generado un plan completo y el archivo JSON para n8n."
      };

    } catch (error: any) {
      return {
        success: false,
        steps,
        error: error.message,
        message: "❌ Hubo un error en la generación del workflow. Por favor, intenta nuevamente."
      };
    }
  }

  // AI Chat endpoint (replacing Supabase Edge Function)
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get OpenAI API key
      const openAIApiKey = process.env.OPENAI_API_KEY;
      if (!openAIApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      let user = null;
      let conversationHistory: Array<{role: string, content: string}> = [];

      // Handle authenticated vs anonymous chat
      if (sessionId !== 'landing-page-chat') {
        // For authenticated users
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            user = await storage.getUser(decoded.userId);
            
            if (user) {
              try {
                // Save user message
                await storage.createMessage({
                  chatSessionId: sessionId,
                  content: message,
                  sender: 'user',
                  role: 'user'
                });

                // Get conversation history
                const messages = await storage.getMessagesBySession(sessionId, 10);
                conversationHistory = messages.map(msg => ({
                  role: msg.role || 'user',
                  content: msg.content
                }));
              } catch (storageError) {
                console.error('Storage error in chat:', storageError);
                // Continue without saving to database for now
              }
            }
          } catch (error) {
            // Continue as anonymous
          }
        }
      }

      // Check if this is a workflow creation request
      if (isWorkflowCreationRequest(message)) {
        // Instead of generating immediately, ask for more information and show button
        const response = `¡Perfecto! Veo que quieres crear una automatización. Para diseñar el agente perfecto para tu negocio, necesito conocer algunos detalles específicos:

🔧 **Herramientas de comunicación:**
- ¿Usarás WhatsApp, Telegram, email, SMS?

🌐 **Plataformas de integración:**
- ¿Facebook, Instagram, LinkedIn, tu website?

💾 **Almacenamiento de datos:**
- ¿Google Drive, Dropbox, servidor local?

📢 **Notificaciones:**
- ¿Email, Slack, Discord, otro?

📊 **Sistema de datos:**
- ¿Hojas de cálculo, CRM específico, base de datos?

📝 **Describe tu proceso actual:** ¿Qué tareas quieres automatizar exactamente?

Una vez que tengas clara esta información, verás un botón "Crear Automatización" que iniciará el proceso completo con nuestros 4 sistemas de IA especializados.`;
        
        // Save AI response
        if (user && sessionId !== 'landing-page-chat') {
          try {
            await storage.createMessage({
              chatSessionId: sessionId,
              content: response,
              sender: 'ai',
              role: 'assistant'
            });
          } catch (storageError) {
            console.error('Storage error saving AI response:', storageError);
          }
        }

        return res.json({ 
          response, 
          sessionId,
          showCreateButton: true
        });
      }

      // Regular chat flow
      const systemMessage = sessionId === 'landing-page-chat' ? {
        role: 'system',
        content: `Eres un consultor senior especializado en IA y automatización empresarial para Precensus AI. Tu misión es ofrecer una CONSULTORÍA GRATUITA personalizada, analizando el negocio del usuario y recomendando las mejores automatizaciones antes de presentar planes.

CUANDO EL USUARIO MENCIONE CREAR UN AGENTE O AUTOMATIZACIÓN:
1. Pregunta qué HERRAMIENTAS específicas quiere usar:
   - ¿WhatsApp, Telegram, email, SMS para comunicación?
   - ¿Facebook, Instagram, LinkedIn, website para integración?
   - ¿Google Drive, Dropbox para almacenamiento?
   - ¿Slack, Discord, email para notificaciones?
   - ¿Hojas de cálculo, CRM específico para datos?

2. Si dice "créame ese agente" o "créalo", explica que iniciarás el proceso completo de generación automática.

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

Actúa como un consultor experto, amigable pero profesional. Haz preguntas inteligentes, escucha atentamente y personaliza cada recomendación al negocio específico del usuario.`
      } : {
        role: 'system',
        content: `Eres un asistente especializado en automatización de procesos. Tu trabajo es:

CUANDO EL USUARIO MENCIONE CREAR UN AGENTE:
1. Pregunta ESPECÍFICAMENTE qué herramientas quiere usar:
   - ¿WhatsApp, Telegram, email, SMS para comunicación?
   - ¿En qué plataforma quiere que se suba? (Facebook, Instagram, LinkedIn, website)
   - ¿Dónde almacenar datos? (Google Drive, Dropbox, servidor)
   - ¿Cómo recibir notificaciones? (email, Slack, Discord)
   - ¿Qué sistema de datos usar? (Hojas de cálculo, CRM específico)

2. NUNCA generes automáticamente el workflow. Siempre pide información específica primero.

3. Una vez que tengas suficiente información detallada, responde: "Ya tengo toda la información necesaria. Puedes usar el botón 'Crear Automatización' para que nuestro equipo de 4 IAs especialistas genere tu workflow personalizado."

OTRAS TAREAS:
1. Entender los procesos que describe el usuario
2. Sugerir automatizaciones específicas y prácticas
3. Ofrecer crear workflows para n8n cuando sea apropiado
4. Ser claro, conciso y actionable en tus respuestas
5. Preguntar detalles específicos cuando necesites más información

Siempre responde en español y enfócate en soluciones de automatización reales con herramientas específicas.`
      };

      const openAIMessages = [
        systemMessage,
        ...conversationHistory.reverse(), // Reverse to get chronological order
        { role: 'user', content: message }
      ];

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
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Error generating AI response' });
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save AI response for authenticated users
      if (user && sessionId !== 'landing-page-chat') {
        try {
          await storage.createMessage({
            chatSessionId: sessionId,
            content: aiResponse,
            sender: 'ai',
            role: 'assistant'
          });
        } catch (storageError) {
          console.error('Storage error saving final AI response:', storageError);
        }
      }

      res.json({ response: aiResponse, sessionId });
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({ error: 'Error generating AI response' });
    }
  });

  // Create automation with contact form
  app.post("/api/create-automation", async (req: Request, res: Response) => {
    try {
      const { conversationContext, email, phone } = req.body;
      
      if (!conversationContext || !email || !phone) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      // Execute multi-AI workflow
      const workflowResult = await orchestrateWorkflowCreation(conversationContext);
      
      if (workflowResult.success && workflowResult.workflowJson) {
        // Send JSON to your emails using SendGrid
        await sendWorkflowEmail(workflowResult.workflowJson, email, phone, conversationContext);
        
        // Save contact info
        console.log('New automation request:', { email, phone, timestamp: new Date() });
        
        return res.json({ 
          success: true, 
          message: 'Automatización creada exitosamente. Te contactaremos pronto.' 
        });
      } else {
        return res.status(500).json({ 
          error: 'Error generando la automatización', 
          details: workflowResult.error 
        });
      }
    } catch (error: any) {
      console.error('Error creating automation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Lead form endpoint
  app.post("/api/send-lead", async (req, res) => {
    try {
      const { name, email, details } = req.body;
      
      // For now, just log the lead - in production you'd send an email
      console.log('New lead received:', { name, email, details });
      
      res.json({ success: true, message: 'Lead received successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error processing lead' });
    }
  });

  // Download workflow JSON endpoint
  app.get("/api/automations/:id/download", authenticateToken, async (req: any, res: any) => {
    try {
      const automation = await storage.getAutomation(req.params.id);
      if (!automation || automation.userId !== req.user.id) {
        return res.status(404).json({ error: "Automation not found" });
      }

      const filename = `workflow-${automation.id}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(automation.workflowJson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get automation details endpoint
  app.get("/api/automations/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const automation = await storage.getAutomation(req.params.id);
      if (!automation || automation.userId !== req.user.id) {
        return res.status(404).json({ error: "Automation not found" });
      }
      res.json(automation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Orchestrate workflow endpoint (for manual trigger)
  app.post("/api/orchestrate", authenticateToken, async (req: any, res: any) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const workflowResult = await orchestrateWorkflowCreation(prompt, req.user.id);
      
      if (workflowResult.success) {
        res.json({
          success: true,
          message: workflowResult.message,
          steps: workflowResult.steps,
          plan: workflowResult.finalPlan,
          workflowJson: workflowResult.workflowJson
        });
      } else {
        res.status(500).json({
          success: false,
          message: workflowResult.message,
          error: workflowResult.error,
          steps: workflowResult.steps
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
