import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatSessionSchema, insertMessageSchema, insertWorkflowSchema, insertAutomationSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

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
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
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
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    const user = req.user;
    res.json({ user: { id: user.id, email: user.email, username: user.username } });
  });

  // Chat Sessions routes
  app.get("/api/chat-sessions", authenticateToken, async (req, res) => {
    try {
      const sessions = await storage.getChatSessionsByUser(req.user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat-sessions", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertChatSessionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const session = await storage.createChatSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/chat-sessions/:id", authenticateToken, async (req, res) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/chat-sessions/:id", authenticateToken, async (req, res) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      await storage.deleteChatSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages routes
  app.get("/api/chat-sessions/:sessionId/messages", authenticateToken, async (req, res) => {
    try {
      const session = await storage.getChatSession(req.params.sessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessagesBySession(req.params.sessionId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      // Verify session belongs to user
      const session = await storage.getChatSession(req.body.chatSessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Workflows routes
  app.get("/api/workflows", authenticateToken, async (req, res) => {
    try {
      const workflows = await storage.getWorkflowsByUser(req.user.id);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const workflow = await storage.createWorkflow(validatedData);
      res.json(workflow);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", authenticateToken, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow || workflow.userId !== req.user.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/workflows/:id", authenticateToken, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow || workflow.userId !== req.user.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const updates = req.body;
      const updatedWorkflow = await storage.updateWorkflow(req.params.id, updates);
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", authenticateToken, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow || workflow.userId !== req.user.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      await storage.deleteWorkflow(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Automations routes
  app.get("/api/automations", authenticateToken, async (req, res) => {
    try {
      const automations = await storage.getAutomationsByUser(req.user.id);
      res.json(automations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/automations", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertAutomationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const automation = await storage.createAutomation(validatedData);
      res.json(automation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // AI Chat endpoint (replacing Supabase Edge Function)
  app.post("/api/chat", async (req, res) => {
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
      let conversationHistory = [];

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
            }
          } catch (error) {
            // Continue as anonymous
          }
        }
      }

      // Prepare messages for OpenAI
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
        await storage.createMessage({
          chatSessionId: sessionId,
          content: aiResponse,
          sender: 'ai',
          role: 'assistant'
        });
      }

      res.json({ response: aiResponse, sessionId });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
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

  const httpServer = createServer(app);

  return httpServer;
}
