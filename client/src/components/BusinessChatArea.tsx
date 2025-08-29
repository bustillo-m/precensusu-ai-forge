
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
import { WorkflowComplexityVisualization } from "./WorkflowComplexityVisualization";

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
    mainActivity?: string;
    challenges?: string;
    processes?: string;
  }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [directAutomation, setDirectAutomation] = useState<string | null>(null);
  const [latestWorkflow, setLatestWorkflow] = useState<any>(null);
  const [showComplexityVisualization, setShowComplexityVisualization] = useState(false);
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
      text: "¡Hola! Para diseñarte las mejores automatizaciones, me gustaría conocer mejor tu negocio. ¿Cuál es el nombre de tu empresa y a qué sector pertenece?",
      field: "company" as keyof typeof businessData,
      followUp: "Por favor, comparte el nombre de tu empresa y especifica claramente el sector (por ejemplo: moda, e-commerce, marketing digital, restaurante, consultoría, etc.)."
    },
    {
      text: "¿Cuál es la principal actividad de vuestra empresa? ¿Qué productos vendéis o servicios ofrecéis exactamente?",
      field: "mainActivity" as keyof typeof businessData,
      followUp: "Describe específicamente qué hace vuestra empresa: venta de productos, servicios de marketing, creación de contenido, etc. Sé lo más concreto posible."
    },
    {
      text: "¿Cuáles son las tareas o procesos más repetitivos que realizáis? ¿Qué actividades os consumen más tiempo del día?",
      field: "processes" as keyof typeof businessData,
      followUp: "Detalla las tareas manuales repetitivas: gestión de pedidos, creación de contenido, atención al cliente, etc."
    },
    {
      text: "¿Cuáles son los principales retos o problemas en esos procesos? ¿Qué os gustaría mejorar o automatizar?",
      field: "challenges" as keyof typeof businessData,
      followUp: "Explica los problemas específicos: falta de tiempo para crear contenido, dificultades con el inventario, problemas de comunicación, etc."
    }
  ];

  const isResponseComplete = (response: string, field: keyof typeof businessData): boolean => {
    const cleanResponse = response.trim().toLowerCase();
    const words = cleanResponse.split(' ').filter(word => word.length > 2);
    
    // Check for minimal information requirements
    if (cleanResponse.length < 15 || words.length < 3) return false;
    
    switch (field) {
      case 'company':
        // Should contain company name and sector/industry
        const hasCompanyIndicators = cleanResponse.includes('empresa') || cleanResponse.includes('compañía') || 
                                   cleanResponse.includes('negocio') || cleanResponse.includes('llamamos') ||
                                   cleanResponse.includes('somos');
        const hasSectorIndicators = ['marketing', 'ventas', 'restaurante', 'tienda', 'ecommerce', 'consultora', 
                                   'servicios', 'tecnología', 'salud', 'educación', 'retail', 'inmobiliaria'].some(sector => 
                                   cleanResponse.includes(sector));
        return hasCompanyIndicators || hasSectorIndicators || cleanResponse.length > 25;
        
      case 'mainActivity':
        // Should describe business model or revenue generation
        const activityKeywords = ['vendemos', 'ofrecemos', 'servicios', 'productos', 'clientes', 'facturación',
                                'ingresos', 'comercializamos', 'distribuimos', 'consultamos', 'asesoramos'];
        return activityKeywords.some(keyword => cleanResponse.includes(keyword)) || words.length >= 6;
        
      case 'challenges':
        // Should describe specific problems or pain points
        const challengeKeywords = ['problema', 'desafío', 'dificultad', 'tiempo', 'lento', 'error', 'manual', 
                                 'repetitivo', 'ineficiente', 'costoso', 'difícil', 'complicado', 'perdemos'];
        return challengeKeywords.some(keyword => cleanResponse.includes(keyword)) || words.length >= 5;
        
      case 'processes':
        // Should describe repetitive tasks or time-consuming activities
        const processKeywords = ['proceso', 'tarea', 'actividad', 'tiempo', 'horas', 'manual', 'repetitivo',
                               'administración', 'gestión', 'entrada', 'registro', 'control', 'seguimiento'];
        return processKeywords.some(keyword => cleanResponse.includes(keyword)) || words.length >= 4;
        
      default:
        return false;
    }
  };

  // Function to detect if user wants direct automation
  const detectDirectAutomation = (message: string): boolean => {
    const cleanMessage = message.trim().toLowerCase();
    
    // Specific direct automation patterns
    const directPatterns = [
      /quiero.*(?:bot|agente|automatizar|automatización)/,
      /necesito.*(?:automatizar|automatización|bot|agente)/,
      /crear.*(?:agente|bot|automatización)/,
      /generar.*(?:automatización|bot|agente)/,
      /hacer.*automático/,
      /automatización.*(?:de|para|que)/,
      /bot.*(?:de|para|que)/,
      /agente.*(?:de|para|que)/,
      /automatizar.*(?:el|la|los|las|mi|mis)/
    ];
    
    // Specific business processes that indicate direct automation
    const processAutomationPatterns = [
      /automatizar.*(?:facturas|ventas|inventario|pedidos|clientes)/,
      /bot.*(?:atención|servicio|ventas|soporte)/,
      /agente.*(?:ventas|marketing|administrativo|servicio)/,
      /automatización.*(?:facturas|contabilidad|inventario|crm)/
    ];
    
    const hasDirectPattern = directPatterns.some(pattern => pattern.test(cleanMessage));
    const hasProcessPattern = processAutomationPatterns.some(pattern => pattern.test(cleanMessage));
    
    // Also check for specific automation types
    const automationTypes = ['chatbot', 'crm', 'facturación', 'inventario', 'leads', 'marketing', 'ventas'];
    const hasAutomationType = automationTypes.some(type => cleanMessage.includes(type));
    
    return hasDirectPattern || hasProcessPattern || hasAutomationType;
  };

  // Function to generate AI agent proposals based on business data
  const generateAgentProposals = (businessData: any) => {
    const proposals = [];
    
    // Combine all business data into one text for analysis
    const allText = Object.values(businessData).join(" ").toLowerCase();
    
    console.log('Analyzing business data:', { businessData, allText });
    
    // Detect specific keywords and propose relevant automations
    
    // Video content creation
    if (allText.includes('video') || allText.includes('vídeo') || allText.includes('contenido') || 
        allText.includes('publicidad') || allText.includes('redes')) {
      proposals.push({
        id: 'video-generator',
        title: '🎞️ Generador de Videos de Producto',
        description: 'Automatiza la creación de videos promocionales de tus productos para anuncios y redes sociales.',
        benefits: ['Videos profesionales en minutos', 'Optimizado para cada plataforma', 'Aumenta engagement y ventas'],
        useCases: ['Videos para Instagram y TikTok', 'Anuncios para Facebook Ads', 'Contenido para e-commerce']
      });
    }
    
    // Social media scheduler
    if (allText.includes('redes') || allText.includes('publicar') || allText.includes('post') ||
        allText.includes('instagram') || allText.includes('facebook') || allText.includes('tiktok')) {
      proposals.push({
        id: 'social-scheduler',
        title: '📅 Planificador de Publicaciones en Redes Sociales',
        description: 'Automatiza la programación y publicación de contenido en Instagram, TikTok y otras plataformas.',
        benefits: ['Programación automática 24/7', 'Contenido optimizado por plataforma', 'Mejor engagement'],
        useCases: ['Programar posts de productos', 'Stories automáticas', 'Campañas de temporada']
      });
    }
    
    // Inventory management
    if (allText.includes('inventario') || allText.includes('stock') || allText.includes('almacén') ||
        allText.includes('productos') || allText.includes('mercancia')) {
      proposals.push({
        id: 'inventory-manager',
        title: '📦 Gestor de Inventario',
        description: 'Automatiza el control de stock, predicción de demanda y gestión de proveedores.',
        benefits: ['Control automático de stock', 'Predicción de demanda', 'Optimiza compras'],
        useCases: ['Seguimiento de inventario', 'Alertas de reposición', 'Análisis de rotación']
      });
    }
    
    // Sales agent
    if (allText.includes('ventas') || allText.includes('prospectos') || allText.includes('leads') ||
        allText.includes('comercial') || allText.includes('clientes potenciales')) {
      proposals.push({
        id: 'sales-agent',
        title: '💼 Agente de Ventas',
        description: 'Automatiza el proceso de ventas desde la prospección hasta el cierre, con seguimientos personalizados.',
        benefits: ['Prospección automática', 'Seguimiento personalizado', 'Aumenta conversiones'],
        useCases: ['Calificar prospectos', 'Seguimiento automático', 'Programación de reuniones']
      });
    }
    
    // Marketing agent
    if (allText.includes('marketing') || allText.includes('publicidad') || allText.includes('campañas') ||
        allText.includes('promocion') || allText.includes('anuncios')) {
      proposals.push({
        id: 'marketing-agent',
        title: '📱 Agente de Marketing',
        description: 'Automatiza campañas de marketing, gestiona redes sociales y analiza métricas de rendimiento.',
        benefits: ['Campañas automáticas', 'Analiza tendencias', 'Optimiza presupuesto publicitario'],
        useCases: ['Publicar en redes sociales', 'Segmentar audiencias', 'Analizar ROI de campañas']
      });
    }
    
    // Customer service
    if (allText.includes('atencion') || allText.includes('atención') || allText.includes('clientes') ||
        allText.includes('soporte') || allText.includes('consultas') || allText.includes('servicio')) {
      proposals.push({
        id: 'customer-service',
        title: '🤖 Agente de Atención al Cliente',
        description: 'Automatiza respuestas a consultas frecuentes y gestiona la atención al cliente 24/7.',
        benefits: ['Respuesta inmediata 24/7', 'Mejora satisfacción', 'Libera tiempo del equipo'],
        useCases: ['Consultas frecuentes', 'Soporte técnico básico', 'Seguimiento post-venta']
      });
    }
    
    // If no specific matches, offer generic automation
    if (proposals.length === 0) {
      proposals.push({
        id: 'custom-agent',
        title: '🛠️ Agente Personalizado',
        description: 'Automatización específica diseñada para las necesidades únicas de tu empresa.',
        benefits: ['Solución a medida', 'Integración completa', 'Máximo ROI'],
        useCases: ['Procesos específicos', 'Integraciones personalizadas', 'Automatización avanzada']
      });
    }
    
    console.log('Generated proposals:', proposals);
    return proposals.slice(0, 3); // Maximum 3 proposals
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
      scrollToBottom();
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
📋 **Actividad:** ${businessData.mainActivity || 'Información no especificada'}
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
      scrollToBottom();
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

    proposalsContent += `💡 **¿Qué automatización te parece más útil para tu empresa?**

Puedes responder de varias formas:
• El **número** (1, 2, 3...)
• "La primera", "la segunda", "la tercera"
• Simplemente "sí" si te gusta alguna
• O descríbeme una automatización personalizada

¡Elige la que más te ayudaría a ahorrar tiempo y dinero!`;

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
      scrollToBottom();
    }

    setAwaitingResponse(true);
  };

  // Handle proposal selection
  const handleProposalSelection = async (sessionId: string, userResponse: string) => {
    const response = userResponse.trim().toLowerCase();
    let selectedProposal = null;

    // Check if user selected a number directly
    const numberMatch = response.match(/(\d+)/);
    if (numberMatch) {
      const proposalIndex = parseInt(numberMatch[1]) - 1;
      if (proposalIndex >= 0 && proposalIndex < proposals.length) {
        selectedProposal = proposals[proposalIndex];
      }
    }
    
    // Check for natural language selection ("la primera", "la segunda", etc.)
    if (!selectedProposal) {
      const naturalSelections = [
        { patterns: [/la primera/, /primera opción/, /opción 1/, /primer/, /primero/], index: 0 },
        { patterns: [/la segunda/, /segunda opción/, /opción 2/, /segundo/], index: 1 },
        { patterns: [/la tercera/, /tercera opción/, /opción 3/, /tercer/, /tercero/], index: 2 }
      ];
      
      for (const selection of naturalSelections) {
        if (selection.patterns.some(pattern => pattern.test(response)) && 
            selection.index < proposals.length) {
          selectedProposal = proposals[selection.index];
          break;
        }
      }
    }
    
    // Check for mentions of proposal titles or keywords
    if (!selectedProposal && proposals.length > 0) {
      for (let i = 0; i < proposals.length; i++) {
        const proposal = proposals[i];
        const titleWords = proposal.title.toLowerCase().split(' ').filter((word: string) => word.length > 3);
        const keywordMatches = [
          'contenido', 'generador', 'marketing', 'leads', 'ventas', 'pedidos', 'inventario', 
          'chatbot', 'atención', 'cliente', 'reportes', 'seguimiento', 'administrativo'
        ];
        
        // Check if user mentions proposal title words or related keywords
        const titleMatch = titleWords.some((word: string) => response.includes(word));
        const keywordMatch = keywordMatches.some(keyword => 
          response.includes(keyword) && proposal.title.toLowerCase().includes(keyword)
        );
        
        if (titleMatch || keywordMatch) {
          selectedProposal = proposal;
          break;
        }
      }
    }
    
    // Check for general acceptance responses ("sí", "me gusta", etc.)
    if (!selectedProposal) {
      const acceptancePatterns = [
        /^sí$/,
        /^si$/,
        /^yes$/,
        /me gusta/,
        /me parece bien/,
        /perfecto/,
        /acepto/,
        /genial/,
        /excelente/,
        /bueno/,
        /quiero.*automatización/,
        /quiero.*agente/,
        /quiero.*bot/,
        /crear.*automatización/,
        /crear.*agente/,
        /me interesa/,
        /está bien/,
        /vale/,
        /ok/,
        /de acuerdo/,
        /quiero esta/,
        /quiero esa/,
        /esa automatización/,
        /esta automatización/,
        /hacer.*automatización/,
        /implementar/,
        /adelante/,
        /vamos/
      ];
      
      if (acceptancePatterns.some(pattern => pattern.test(response))) {
        if (proposals.length === 1) {
          // If only one proposal, select it
          selectedProposal = proposals[0];
        } else {
          // Multiple proposals, ask for clarification
          const clarificationMessage: Message = {
            id: Date.now().toString(),
            content: `¡Perfecto! Veo que te interesa una de las automatizaciones. 

¿Cuál de las ${proposals.length} opciones te parece más útil?

Puedes responder con:
• El **número** (1, 2, 3...)
• "La primera", "la segunda", etc.
• O menciona palabras clave de la automatización que prefieras

¿Cuál eliges?`,
            sender: "ai",
            session_id: sessionId,
            message_type: 'question',
            created_at: new Date().toISOString()
          };

          const savedMessage = await saveMessage(clarificationMessage);
          if (savedMessage) {
            setMessages(prev => [...prev, savedMessage]);
            scrollToBottom();
          }
          return;
        }
      }
    }

    if (selectedProposal) {
      // User selected a proposal - proceed with automation creation
      await triggerAutomationCreation(sessionId, selectedProposal);
    } else if (response.includes('personalizado') || response.includes('específico') || 
               response.includes('otro') || response.includes('diferente') || 
               response.includes('custom') || response.includes('distinto')) {
      // User wants something custom
      const customMessage: Message = {
        id: Date.now().toString(),
        content: `¡Perfecto! Me encanta que busques una solución personalizada.

Por favor, describe con más detalle:
• ¿Qué proceso específico quieres automatizar?
• ¿Cuáles serían los pasos ideales de esta automatización?
• ¿Qué resultado final esperas obtener?

Una vez que tenga estos detalles, crearé una automatización completamente personalizada para vuestra empresa.`,
        sender: "ai",
        session_id: sessionId,
        message_type: 'question',
        created_at: new Date().toISOString()
      };

      const savedMessage = await saveMessage(customMessage);
      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);
        scrollToBottom();
      }

      setDirectAutomation(userResponse);
      setAwaitingResponse(true);
    } else {
      // Invalid response, ask again with more examples
      const clarificationMessage: Message = {
        id: Date.now().toString(),
        content: `No he podido identificar tu selección. 

Puedes responder de varias formas:
• El **número** de la propuesta (1, 2, 3...)
• "La primera", "la segunda", "la tercera"
• Simplemente "sí" si te gusta alguna
• Menciona palabras clave de la automatización que prefieras
• O di "personalizado" si necesitas algo diferente

¿Cuál de las automatizaciones te parece más útil para vuestra empresa?`,
        sender: "ai",
        session_id: sessionId,
        message_type: 'question',
        created_at: new Date().toISOString()
      };

      const savedMessage = await saveMessage(clarificationMessage);
      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);
        scrollToBottom();
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
      scrollToBottom();
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
      console.log('Automation creation response:', data);

      // Store workflow data for complexity analysis
      if (data.workflowJson) {
        setLatestWorkflow(data.workflowJson);
        setShowComplexityVisualization(true);
      }

      // Create download function for JSON if available
      const downloadJSON = (jsonData: any) => {
        const dataStr = JSON.stringify(jsonData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `automatizacion-${Date.now()}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      };

      let successContent = '';
      let downloadButton = '';
      
      // Base success message
      if (selectedProposal) {
        successContent = `🎉 ¡${selectedProposal.title} creada exitosamente!

Hemos generado tu automatización específicamente diseñada para:
• **Empresa:** ${businessData.company}
• **Automatización:** ${selectedProposal.title}
• **Beneficios esperados:** ${selectedProposal.benefits.join(', ')}`;
      } else {
        successContent = `🎉 ¡Automatización personalizada creada exitosamente!

Hemos generado tu automatización basada en el análisis de:
• **Tu empresa:** ${businessData.company}
• **Actividad:** ${businessData.mainActivity}
• **Desafíos identificados:** ${businessData.challenges}
• **Procesos optimizados:** ${businessData.processes}`;
      }
      
      // Add email status and download info
      if (data.emailSent) {
        successContent += `

✅ **Email enviado exitosamente**
El archivo JSON ha sido enviado a tu email: ${user.email}

📧 Te contactaremos pronto con los detalles de implementación.`;
      } else if (data.downloadAvailable && data.workflowJson) {
        successContent += `

⚠️ **Problema con email**: ${data.emailError || 'No se pudo enviar el email'}

📋 **Descarga disponible**: Tu automatización está lista. Haz clic en el botón de abajo para descargar el archivo JSON.

📧 Te contactaremos pronto a ${user.email} con los detalles de implementación.`;
        downloadButton = `

[Descargar JSON de Automatización]`;
      } else {
        successContent += `

📋 El archivo JSON de la automatización ha sido generado.

📧 Te contactaremos pronto a ${user.email} con los detalles de implementación.`;
      }
      
      successContent += `

¡Gracias por confiar en Fluix AI para automatizar tu negocio! 🚀`;

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
        scrollToBottom();
      }
      
      // If download is available, add download message/button
      if (data.downloadAvailable && data.workflowJson) {
        const downloadMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `📋 **Descarga tu automatización**

Haz clic en el botón de abajo para descargar el archivo JSON de tu automatización:

🔽 [DESCARGAR AUTOMATIZACIÓN.JSON] 🔽

*Este archivo contiene toda la configuración de tu automatización y puede importarse en N8N o sistemas similares.*`,
          sender: "ai",
          session_id: sessionId,
          created_at: new Date().toISOString()
        };

        const savedDownloadMessage = await saveMessage(downloadMessage);
        if (savedDownloadMessage) {
          setMessages(prev => [...prev, savedDownloadMessage]);
          scrollToBottom();
        }
        
        // Auto-trigger download
        setTimeout(() => {
          downloadJSON(data.workflowJson);
        }, 1000);
      }

      toast({
        title: "¡Éxito!",
        description: data.emailSent ? "Automatización creada y enviada por email." : "Automatización creada. ¡Descarga disponible!",
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
        scrollToBottom();
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
      scrollToBottom();
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
            scrollToBottom();
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
      scrollToBottom();
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

        {/* Workflow Complexity Visualization */}
        {showComplexityVisualization && latestWorkflow && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[85%]">
              <Bot className="w-8 h-8 text-primary bg-primary/10 rounded-full p-1 flex-shrink-0 mt-1" />
              <div className="bg-muted rounded-lg p-4 w-full">
                <div className="mb-3">
                  <h4 className="font-semibold text-sm mb-1">📊 Análisis de Complejidad del Workflow</h4>
                  <p className="text-xs text-muted-foreground">
                    Analicemos la complejidad de tu automatización generada:
                  </p>
                </div>
                <WorkflowComplexityVisualization 
                  workflowData={latestWorkflow}
                  showDetailedView={false}
                  className="mb-2"
                />
                <div className="text-xs text-muted-foreground mt-3">
                  💡 Haz clic en el indicador de complejidad para ver un análisis detallado
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