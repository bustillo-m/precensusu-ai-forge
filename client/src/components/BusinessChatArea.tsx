import { useState, useEffect, useRef } from "react";

interface User {
  id: string;
  email: string;
  username: string;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Send, Bot, User as UserIcon, Lightbulb, Target, Settings, ArrowRight } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  session_id: string;
  created_at: string;
  message_type?: 'question' | 'proposal' | 'standard';
}

interface BusinessChatAreaProps {
  user: User;
  currentChatId: string | null;
  onCreateChat: (title?: string) => Promise<string | null>;
}


export function BusinessChatArea({ user, currentChatId, onCreateChat }: BusinessChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'discovery' | 'analysis' | 'proposal' | 'creation'>('discovery');
  const [businessData, setBusinessData] = useState<{
    company?: string;
    industry?: string;
    mainActivity?: string;
    challenges?: string;
    processes?: string;
  }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [directAutomation, setDirectAutomation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages();
    } else {
      setMessages([]);
      setCurrentPhase('discovery');
      setBusinessData({});
      setCurrentQuestion(0);
      setAwaitingResponse(false);
      setProposals([]);
      setDirectAutomation(null);
    }
  }, [currentChatId]);

  const fetchMessages = async () => {
    if (!currentChatId) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/chat-sessions/${currentChatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Error fetching messages");
        return;
      }

      const data = await response.json();

      // Transform database records to Message interface
      const transformedMessages: Message[] = (data || []).map((record: any) => ({
        id: record.id,
        content: record.content,
        sender: record.sender as "user" | "ai",
        session_id: record.chatSessionId,
        created_at: record.createdAt,
        message_type: record.role as 'question' | 'proposal' | 'standard' | undefined
      }));

      setMessages(transformedMessages);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const saveMessage = async (message: Omit<Message, "id" | "created_at">) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: message.content,
          sender: message.sender,
          chatSessionId: message.session_id,
          role: message.message_type || 'standard'
        })
      });

      if (!response.ok) {
        console.error("Error saving message");
        return null;
      }

      const data = await response.json();

      // Transform database record to Message interface
      const transformedMessage: Message = {
        id: data.id,
        content: data.content,
        sender: data.sender as "user" | "ai",
        session_id: data.chatSessionId,
        created_at: data.createdAt,
        message_type: data.role as 'question' | 'proposal' | 'standard' | undefined
      };

      return transformedMessage;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const discoveryQuestions = [
    {
      text: "¿Cuál es el nombre de tu empresa y a qué sector pertenece?",
      field: "company" as keyof typeof businessData,
      followUp: "Por favor, proporciona el nombre de tu empresa y el sector en el que opera."
    },
    {
      text: "¿Cuál es la principal actividad o servicio que ofrece tu empresa?",
      field: "mainActivity" as keyof typeof businessData,
      followUp: "Describe con más detalle la actividad principal de tu empresa y cómo generas ingresos."
    },
    {
      text: "¿Cuáles son los principales desafíos o problemas operativos que enfrenta tu empresa actualmente?",
      field: "challenges" as keyof typeof businessData,
      followUp: "Menciona los principales obstáculos, tareas repetitivas o problemas que te gustaría resolver."
    },
    {
      text: "¿Qué procesos o departamentos de tu empresa consumen más tiempo o recursos?",
      field: "processes" as keyof typeof businessData,
      followUp: "Identifica las áreas donde más tiempo se invierte o donde hay más trabajo manual."
    }
  ];

  const isResponseComplete = (response: string, field: keyof typeof businessData): boolean => {
    const cleanResponse = response.trim().toLowerCase();
    
    // Check for minimal information requirements
    if (cleanResponse.length < 10) return false;
    
    switch (field) {
      case 'company':
        return cleanResponse.includes('empresa') || cleanResponse.includes('compañía') || 
               cleanResponse.includes('negocio') || cleanResponse.length > 15;
      case 'mainActivity':
        return cleanResponse.includes('servicio') || cleanResponse.includes('producto') ||
               cleanResponse.includes('vendemos') || cleanResponse.includes('ofrecemos') ||
               cleanResponse.length > 20;
      case 'challenges':
        return cleanResponse.includes('problema') || cleanResponse.includes('desafío') ||
               cleanResponse.includes('dificultad') || cleanResponse.includes('tiempo') ||
               cleanResponse.length > 20;
      case 'processes':
        return cleanResponse.includes('proceso') || cleanResponse.includes('departamento') ||
               cleanResponse.includes('área') || cleanResponse.includes('tiempo') ||
               cleanResponse.length > 15;
      default:
        return false;
    }
  };

  // Function to detect if user wants direct automation
  const detectDirectAutomation = (message: string): boolean => {
    const cleanMessage = message.trim().toLowerCase();
    const automationKeywords = ['automatizar', 'automatización', 'automático', 'bot', 'agente'];
    const processKeywords = ['proceso', 'tarea', 'flujo', 'operación', 'actividad'];
    
    const hasAutomationKeyword = automationKeywords.some(keyword => cleanMessage.includes(keyword));
    const hasProcessKeyword = processKeywords.some(keyword => cleanMessage.includes(keyword));
    
    // Also check for specific scenarios like "quiero un bot que...", "necesito automatizar..."
    const specificPatterns = [
      /quiero.*bot/,
      /necesito.*automatizar/,
      /crear.*agente/,
      /generar.*automatización/,
      /hacer.*automático/
    ];
    
    const hasSpecificPattern = specificPatterns.some(pattern => pattern.test(cleanMessage));
    
    return (hasAutomationKeyword && hasProcessKeyword) || hasSpecificPattern;
  };

  // Function to generate AI agent proposals based on business data
  const generateAgentProposals = (businessData: any) => {
    const proposals = [];
    
    // Analyze business challenges and suggest relevant agents
    const challenges = businessData.challenges?.toLowerCase() || '';
    const processes = businessData.processes?.toLowerCase() || '';
    const mainActivity = businessData.mainActivity?.toLowerCase() || '';
    
    // Customer Service Agent
    if (challenges.includes('clientes') || challenges.includes('atención') || 
        processes.includes('servicio') || processes.includes('soporte')) {
      proposals.push({
        id: 'customer-service',
        title: '🤖 Agente de Atención al Cliente',
        description: 'Automatiza respuestas a consultas frecuentes, gestiona tickets de soporte y mejora la experiencia del cliente 24/7.',
        benefits: ['Respuesta inmediata 24/7', 'Reduce costos de soporte', 'Mejora satisfacción del cliente'],
        useCases: ['Responder preguntas frecuentes', 'Gestionar quejas y sugerencias', 'Derivar casos complejos']
      });
    }
    
    // Sales Agent
    if (mainActivity.includes('venta') || challenges.includes('ventas') || 
        processes.includes('comercial') || challenges.includes('leads')) {
      proposals.push({
        id: 'sales-agent',
        title: '💼 Agente de Ventas Inteligente',
        description: 'Automatiza el seguimiento de leads, califica prospectos y gestiona el pipeline de ventas.',
        benefits: ['Aumenta conversión de leads', 'Seguimiento automático', 'Analiza comportamiento de clientes'],
        useCases: ['Calificar leads automáticamente', 'Enviar seguimientos personalizados', 'Programar reuniones']
      });
    }
    
    // Administrative Agent
    if (challenges.includes('administrativo') || challenges.includes('papeles') || 
        processes.includes('administración') || challenges.includes('documentos')) {
      proposals.push({
        id: 'admin-agent',
        title: '📋 Asistente Administrativo IA',
        description: 'Automatiza tareas administrativas como gestión de documentos, programación y reportes.',
        benefits: ['Elimina trabajo repetitivo', 'Organiza documentos automáticamente', 'Genera reportes instant'],
        useCases: ['Procesar facturas y documentos', 'Programar citas y reuniones', 'Generar reportes automáticos']
      });
    }
    
    // Marketing Agent
    if (challenges.includes('marketing') || challenges.includes('redes sociales') || 
        processes.includes('publicidad') || mainActivity.includes('marketing')) {
      proposals.push({
        id: 'marketing-agent',
        title: '📱 Agente de Marketing Digital',
        description: 'Automatiza campañas de marketing, gestiona redes sociales y analiza métricas de rendimiento.',
        benefits: ['Campañas automáticas', 'Analiza tendencias', 'Optimiza presupuesto publicitario'],
        useCases: ['Publicar en redes sociales', 'Segmentar audiencias', 'Analizar ROI de campañas']
      });
    }
    
    // Inventory Agent
    if (challenges.includes('inventario') || challenges.includes('stock') || 
        processes.includes('almacén') || mainActivity.includes('productos')) {
      proposals.push({
        id: 'inventory-agent',
        title: '📦 Gestor de Inventario IA',
        description: 'Automatiza control de stock, predicción de demanda y gestión de proveedores.',
        benefits: ['Evita agotamiento de stock', 'Optimiza pedidos', 'Reduce costos de almacenaje'],
        useCases: ['Monitorear niveles de stock', 'Generar órdenes de compra', 'Predecir demanda']
      });
    }
    
    // Default generic automation if no specific match
    if (proposals.length === 0) {
      proposals.push({
        id: 'custom-agent',
        title: '🛠️ Agente Personalizado',
        description: 'Automatización específica diseñada para las necesidades únicas de tu empresa.',
        benefits: ['Solución a medida', 'Integración completa', 'Máximo ROI'],
        useCases: ['Procesos específicos de tu empresa', 'Integraciones personalizadas', 'Automatización avanzada']
      });
    }
    
    return proposals.slice(0, 3); // Return max 3 proposals
  };

  const askNextQuestion = async (sessionId: string) => {
    console.log('askNextQuestion called with currentQuestion:', currentQuestion, 'total:', discoveryQuestions.length);
    await askNextQuestionByIndex(sessionId, currentQuestion);
  };

  const askNextQuestionByIndex = async (sessionId: string, questionIndex: number) => {
    console.log('askNextQuestionByIndex called with questionIndex:', questionIndex, 'total:', discoveryQuestions.length);
    if (questionIndex >= discoveryQuestions.length) {
      // All questions completed, generate proposals
      console.log('All questions completed, generating proposals');
      await generateProposalsPhase(sessionId);
      return;
    }

    const question = discoveryQuestions[questionIndex];
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: question.text,
      sender: "ai",
      session_id: sessionId,
      message_type: 'question',
      created_at: new Date().toISOString()
    };

    const savedMessage = await saveMessage(aiMessage);
    if (savedMessage) {
      setMessages(prev => [...prev, savedMessage]);
      setTimeout(scrollToBottom, 100);
    }
    
    setAwaitingResponse(true);
  };

  // Generate and show AI agent proposals
  const generateProposalsPhase = async (sessionId: string) => {
    setCurrentPhase('analysis');
    
    const analysisMessage: Message = {
      id: Date.now().toString(),
      content: `🔍 **Analizando tu empresa...**

Perfecto! He recopilado información valiosa sobre tu empresa:

🏢 **${businessData.company}**
📋 **Actividad:** ${businessData.mainActivity}
⚠️ **Principales desafíos:** ${businessData.challenges}
⏰ **Procesos que consumen más tiempo:** ${businessData.processes}

Ahora voy a generar propuestas de agentes IA específicamente diseñados para resolver los desafíos de tu empresa...`,
      sender: "ai",
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const savedAnalysis = await saveMessage(analysisMessage);
    if (savedAnalysis) {
      setMessages(prev => [...prev, savedAnalysis]);
      setTimeout(scrollToBottom, 100);
    }

    // Generate proposals after a brief delay
    setTimeout(() => {
      showProposals(sessionId);
    }, 3000);
  };

  const showProposals = async (sessionId: string) => {
    setCurrentPhase('proposal');
    const generatedProposals = generateAgentProposals(businessData);
    setProposals(generatedProposals);

    let proposalsContent = `🚀 **Propuestas de Agentes IA para tu empresa**

Basado en el análisis de tu empresa, estas son las automatizaciones que más impacto tendrían:

`;

    generatedProposals.forEach((proposal, index) => {
      proposalsContent += `**${index + 1}. ${proposal.title}**
${proposal.description}

✅ **Beneficios:**
${proposal.benefits.map(benefit => `• ${benefit}`).join('\n')}

🎯 **Casos de uso:**
${proposal.useCases.map(useCase => `• ${useCase}`).join('\n')}

---

`;
    });

    proposalsContent += `💡 **¿Qué te parece más útil para tu empresa?**

Escribe el **número** de la propuesta que más te interese (1, 2, 3...) o si ninguna encaja perfectamente, dime qué tipo de automatización específica necesitas.`;

    const proposalMessage: Message = {
      id: Date.now().toString(),
      content: proposalsContent,
      sender: "ai",
      session_id: sessionId,
      message_type: 'proposal',
      created_at: new Date().toISOString()
    };

    const savedProposal = await saveMessage(proposalMessage);
    if (savedProposal) {
      setMessages(prev => [...prev, savedProposal]);
      setTimeout(scrollToBottom, 100);
    }

    setAwaitingResponse(true);
  };

  // Handle proposal selection
  const handleProposalSelection = async (sessionId: string, userResponse: string) => {
    const response = userResponse.trim().toLowerCase();
    let selectedProposal = null;

    // Check if user selected a number
    const numberMatch = response.match(/(\d+)/);
    if (numberMatch) {
      const proposalIndex = parseInt(numberMatch[1]) - 1;
      if (proposalIndex >= 0 && proposalIndex < proposals.length) {
        selectedProposal = proposals[proposalIndex];
      }
    }

    if (selectedProposal) {
      // User selected a proposal - proceed with automation creation
      await triggerAutomationCreation(sessionId, selectedProposal);
    } else if (response.includes('personalizado') || response.includes('específico') || response.includes('otro')) {
      // User wants something custom
      const customMessage: Message = {
        id: Date.now().toString(),
        content: `Perfecto! Me encanta que busques una solución personalizada.

Por favor, describe con más detalle:
• ¿Qué proceso específico quieres automatizar?
• ¿Cuáles serían los pasos ideales de esta automatización?
• ¿Qué resultado final esperas obtener?

Una vez que tenga estos detalles, crearé una automatización completamente personalizada para tu empresa.`,
        sender: "ai",
        session_id: sessionId,
        message_type: 'question',
        created_at: new Date().toISOString()
      };

      const savedMessage = await saveMessage(customMessage);
      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);
        setTimeout(scrollToBottom, 100);
      }

      setDirectAutomation(userResponse);
      setAwaitingResponse(true);
    } else {
      // Invalid response, ask again
      const clarificationMessage: Message = {
        id: Date.now().toString(),
        content: `No he podido identificar tu selección. 

Por favor, responde con:
• El **número** de la propuesta que te interese (1, 2, 3...)
• O dime "personalizado" si necesitas algo específico diferente

¿Cuál de las opciones te parece más útil para tu empresa?`,
        sender: "ai",
        session_id: sessionId,
        message_type: 'question',
        created_at: new Date().toISOString()
      };

      const savedMessage = await saveMessage(clarificationMessage);
      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);
        setTimeout(scrollToBottom, 100);
      }
    }
  };

  const triggerAutomationCreation = async (sessionId: string, selectedProposal?: any) => {
    setCurrentPhase('creation');
    
    let content = '';
    if (selectedProposal) {
      content = `🎉 **¡Excelente elección!**

Has seleccionado: **${selectedProposal.title}**

${selectedProposal.description}

Ahora voy a crear esta automatización específicamente para tu empresa utilizando nuestro sistema de IA avanzado. Este proceso puede tomar unos momentos...

🤖 Iniciando creación de automatización personalizada...`;
    } else if (directAutomation) {
      content = `🚀 **Creación de automatización personalizada**

Voy a crear la automatización específica que has solicitado, adaptada perfectamente a las necesidades de tu empresa.

Este proceso utiliza nuestro sistema de IA avanzado con múltiples etapas de optimización...

🤖 Iniciando creación de automatización personalizada...`;
    } else {
      content = `🎯 **Creando tu automatización empresarial**

Basado en el análisis completo de tu empresa, voy a crear una automatización que resuelva los desafíos específicos que identificamos.

🏢 **Empresa:** ${businessData.company}
📋 **Actividad:** ${businessData.mainActivity}
⚠️ **Desafíos:** ${businessData.challenges}
⏰ **Procesos a optimizar:** ${businessData.processes}

🤖 Iniciando creación de automatización...`;
    }

    const aiMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "ai",
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const savedMessage = await saveMessage(aiMessage);
    if (savedMessage) {
      setMessages(prev => [...prev, savedMessage]);
      setTimeout(scrollToBottom, 100);
    }

    // Trigger the multi-AI automation creation
    setTimeout(() => {
      createAutomationFlow(sessionId, selectedProposal);
    }, 2000);
  };

  const createAutomationFlow = async (sessionId: string, selectedProposal?: any) => {
    setLoading(true);
    try {
      // Get conversation context 
      let conversationContext = '';
      
      if (selectedProposal) {
        conversationContext = `Empresa: ${businessData.company}
Actividad: ${businessData.mainActivity}
Desafíos: ${businessData.challenges}
Procesos: ${businessData.processes}

Automatización seleccionada: ${selectedProposal.title}
Descripción: ${selectedProposal.description}
Beneficios esperados: ${selectedProposal.benefits.join(', ')}
Casos de uso: ${selectedProposal.useCases.join(', ')}`;
      } else if (directAutomation) {
        conversationContext = `Automatización solicitada directamente: ${directAutomation}
Usuario: ${user.email}`;
      } else {
        conversationContext = `Empresa: ${businessData.company}
Actividad: ${businessData.mainActivity}
Desafíos: ${businessData.challenges}
Procesos: ${businessData.processes}`;
      }
      
      const response = await fetch('/api/create-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationContext,
          email: user.email,
          phone: 'No proporcionado'
        }),
      });

      if (!response.ok) {
        throw new Error('Error creating automation');
      }

      const data = await response.json();

      let successContent = '';
      if (selectedProposal) {
        successContent = `🎉 ¡${selectedProposal.title} creada exitosamente!

Hemos generado tu automatización específicamente diseñada para:
• **Empresa:** ${businessData.company}
• **Automatización:** ${selectedProposal.title}
• **Beneficios esperados:** ${selectedProposal.benefits.join(', ')}

El archivo JSON de la automatización ha sido enviado para revisión final.

📧 Te contactaremos pronto a ${user.email} con los detalles de implementación.

¡Gracias por confiar en Fluix AI para automatizar tu negocio! 🚀`;
      } else {
        successContent = `🎉 ¡Automatización personalizada creada exitosamente!

Hemos generado tu automatización basada en el análisis de:
• **Tu empresa:** ${businessData.company}
• **Actividad:** ${businessData.mainActivity}
• **Desafíos identificados:** ${businessData.challenges}
• **Procesos optimizados:** ${businessData.processes}

El archivo JSON de la automatización ha sido enviado para revisión final.

📧 Te contactaremos pronto a ${user.email} con los detalles de implementación.

¡Gracias por confiar en Fluix AI para automatizar tu negocio! 🚀`;
      }

      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: successContent,
        sender: "ai",
        session_id: sessionId,
        created_at: new Date().toISOString()
      };

      const savedMessage = await saveMessage(successMessage);
      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);
        setTimeout(scrollToBottom, 100);
      }

      toast({
        title: "¡Éxito!",
        description: "Automatización creada. Te contactaremos pronto.",
      });

    } catch (error) {
      console.error('Error creating automation:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error al crear la automatización. Por favor, intenta de nuevo.',
        sender: "ai",
        session_id: sessionId,
        created_at: new Date().toISOString()
      };
      const savedErrorMessage = await saveMessage(errorMessage);
      if (savedErrorMessage) {
        setMessages(prev => [...prev, savedErrorMessage]);
        setTimeout(scrollToBottom, 100);
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la automatización.",
      });
    } finally {
      setLoading(false);
    }
  };




  const handleSend = async () => {
    if (!newMessage.trim()) return;

    let sessionId = currentChatId;
    if (!sessionId) {
      sessionId = await onCreateChat(`Consulta: ${newMessage.substring(0, 30)}...`);
      if (!sessionId) return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    // Save user message
    const savedUserMessage = await saveMessage(userMessage);
    if (savedUserMessage) {
      setMessages(prev => [...prev, savedUserMessage]);
      setTimeout(scrollToBottom, 100);
    }

    const originalMessage = newMessage;
    setNewMessage("");
    setLoading(true);

    // Phase-based logic handling
    if (currentPhase === 'discovery') {
      if (!awaitingResponse && currentQuestion === 0) {
        // First message - decide if direct automation or discovery
        if (detectDirectAutomation(originalMessage)) {
          // User wants direct automation
          setDirectAutomation(originalMessage);
          await triggerAutomationCreation(sessionId);
          setLoading(false);
          return;
        } else {
          // Start discovery process
          await askNextQuestion(sessionId);
          setLoading(false);
          return;
        }
      }

      // Handle discovery questions
      if (awaitingResponse && currentQuestion < discoveryQuestions.length) {
        const currentQuestionData = discoveryQuestions[currentQuestion];
        const isComplete = isResponseComplete(originalMessage, currentQuestionData.field);
        
        if (isComplete) {
          // Save the response to business data
          const updatedData = { ...businessData };
          updatedData[currentQuestionData.field] = originalMessage;
          setBusinessData(updatedData);
          
          // Move to next question
          const nextQuestionIndex = currentQuestion + 1;
          setCurrentQuestion(nextQuestionIndex);
          setAwaitingResponse(false);
          
          // Ask next question or complete the flow
          setTimeout(async () => {
            console.log('About to ask next question. nextQuestionIndex:', nextQuestionIndex, 'total questions:', discoveryQuestions.length);
            await askNextQuestionByIndex(sessionId, nextQuestionIndex);
            setLoading(false);
          }, 1000);
        } else {
          // Response is incomplete, ask for more details
          const followUpMessage: Message = {
            id: Date.now().toString(),
            content: currentQuestionData.followUp,
            sender: "ai",
            session_id: sessionId,
            message_type: 'question',
            created_at: new Date().toISOString()
          };

          const savedFollowUp = await saveMessage(followUpMessage);
          if (savedFollowUp) {
            setMessages(prev => [...prev, savedFollowUp]);
            setTimeout(scrollToBottom, 100);
          }
          setLoading(false);
        }
        return;
      }
    }

    if (currentPhase === 'proposal') {
      // Handle proposal selection
      if (awaitingResponse) {
        await handleProposalSelection(sessionId, originalMessage);
        setAwaitingResponse(false);
        setLoading(false);
        return;
      }
    }

    if (currentPhase === 'creation') {
      // Handle custom automation details if requested
      if (directAutomation && awaitingResponse) {
        // User provided custom automation details
        setDirectAutomation(directAutomation + '\n\nDetalles adicionales: ' + originalMessage);
        await triggerAutomationCreation(sessionId);
        setAwaitingResponse(false);
        setLoading(false);
        return;
      }
    }

    // General conversation after automation is created or other phases
    const generalResponse: Message = {
      id: Date.now().toString(),
      content: "Gracias por tu mensaje. ¿Hay algo más en lo que pueda ayudarte con respecto a la automatización de tu empresa?",
      sender: "ai",
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    const savedResponse = await saveMessage(generalResponse);
    if (savedResponse) {
      setMessages(prev => [...prev, savedResponse]);
      setTimeout(scrollToBottom, 100);
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  if (!currentChatId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <Building2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Consultor IA Empresarial</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Analizamos tu empresa y proponemos agentes IA específicos para optimizar tus procesos
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Análisis Personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Estudiamos tu empresa y procesos específicos
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Lightbulb className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Propuestas Específicas</h3>
                <p className="text-sm text-muted-foreground">
                  Recomendamos agentes IA adaptados a tus necesidades
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Implementación</h3>
                <p className="text-sm text-muted-foreground">
                  Creamos y configuramos los agentes para tu empresa
                </p>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={() => onCreateChat()}
            size="lg"
            className="gap-2"
          >
            <Bot className="h-5 w-5" />
            Iniciar Consulta Empresarial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-semibold">Consultor IA Empresarial</h1>
              <div className="flex items-center gap-2">
                <Badge variant={currentPhase === 'discovery' ? 'default' : 'secondary'}>
                  Descubrimiento ({currentQuestion}/4)
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={currentPhase === 'analysis' ? 'default' : 'secondary'}>
                  Análisis
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={currentPhase === 'proposal' ? 'default' : 'secondary'}>
                  Propuestas
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={currentPhase === 'creation' ? 'default' : 'secondary'}>
                  Creación
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-32 relative max-h-[calc(100vh-200px)]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Hola! Soy tu consultor IA empresarial</h3>
            <p className="text-muted-foreground mb-6">
              Puedo ayudarte de dos formas: analizando tu empresa para sugerir automatizaciones o creando directamente lo que necesitas.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="font-medium mb-2">🤖 ¿Cómo puedo ayudarte?</p>
              <div className="text-sm space-y-1">
                <p><strong>Automatización directa:</strong> Dime "quiero automatizar [proceso]" si ya sabes qué necesitas</p>
                <p><strong>Consulta empresarial:</strong> Analizo tu empresa y sugiero las mejores automatizaciones para ti</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Envía cualquier mensaje para comenzar
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "ai" && (
              <div className="flex items-start">
                <Bot className="w-8 h-8 text-primary bg-primary/10 rounded-full p-1" />
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
            </div>

            {message.sender === "user" && (
              <div className="flex items-start">
                <UserIcon className="w-8 h-8 text-muted-foreground bg-muted rounded-full p-1" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary bg-primary/10 rounded-full p-1" />
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Analizando tu empresa...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed input area at absolute bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={awaitingResponse ? "Responde a la pregunta..." : "Escribe cualquier mensaje para comenzar la consulta..."}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}