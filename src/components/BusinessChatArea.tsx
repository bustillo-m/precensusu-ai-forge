import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Send, Bot, User as UserIcon, Lightbulb, Target, Settings, ArrowRight, CheckCircle } from "lucide-react";

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

interface AgentProposal {
  name: string;
  description: string;
  benefits: string[];
  implementation: string;
}

export function BusinessChatArea({ user, currentChatId, onCreateChat }: BusinessChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'discovery' | 'analysis' | 'proposal'>('discovery');
  const [businessData, setBusinessData] = useState<any>({});
  const [proposedAgents, setProposedAgents] = useState<AgentProposal[]>([]);
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
      setProposedAgents([]);
    }
  }, [currentChatId]);

  const fetchMessages = async () => {
    if (!currentChatId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_session_id", currentChatId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      // Transform database records to Message interface
      const transformedMessages: Message[] = (data || []).map(record => ({
        id: record.id,
        content: record.content,
        sender: record.sender as "user" | "ai",
        session_id: record.chat_session_id,
        created_at: record.created_at,
        message_type: record.role as 'question' | 'proposal' | 'standard' | undefined
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const saveMessage = async (message: Omit<Message, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          content: message.content,
          sender: message.sender,
          chat_session_id: message.session_id,
          role: message.message_type || 'standard'
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        return null;
      }

      // Transform database record to Message interface
      const transformedMessage: Message = {
        id: data.id,
        content: data.content,
        sender: data.sender as "user" | "ai",
        session_id: data.chat_session_id,
        created_at: data.created_at,
        message_type: data.role as 'question' | 'proposal' | 'standard' | undefined
      };

      return transformedMessage;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const discoveryQuestions = [
    "¿A qué se dedica tu empresa? ¿Cuál es tu producto o servicio principal?",
    "¿Cuáles son los principales procesos que consumen más tiempo en tu empresa?",
    "¿Qué tareas repetitivas realizas o tu equipo realiza diariamente?",
    "¿Cómo gestionas actualmente la comunicación con clientes?",
    "¿Qué herramientas o software utilizas para el trabajo diario?",
    "¿Cuáles son los principales puntos de dolor en tus operaciones?",
    "¿Qué objetivos de crecimiento tienes para los próximos 6 meses?"
  ];

  const generateAIResponse = async (userMessage: string, sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: userMessage,
          sessionId: sessionId,
          business_context: businessData,
          current_phase: currentPhase
        }
      });

      if (error) throw error;

      // Analyze the conversation to determine next phase
      const messageCount = messages.filter(m => m.sender === 'user').length;
      const hasBusinessInfo = Object.keys(businessData).length > 3;

      if (messageCount >= 4 && hasBusinessInfo && currentPhase === 'discovery') {
        setCurrentPhase('analysis');
        setTimeout(() => {
          generateAgentProposals();
        }, 2000);
      }

      return data.response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "Lo siento, hubo un error procesando tu mensaje. ¿Podrías intentar de nuevo?";
    }
  };

  const generateAgentProposals = async () => {
    // Simulated agent proposals based on business data
    const proposals: AgentProposal[] = [
      {
        name: "Agente de Atención al Cliente",
        description: "Automatización completa de respuestas a consultas frecuentes y escalación inteligente",
        benefits: ["Respuesta 24/7", "Reducción 80% tiempo respuesta", "Escalación automática de casos complejos"],
        implementation: "Integración con WhatsApp, email y chat web. Base de conocimiento personalizada."
      },
      {
        name: "Agente de Marketing de Contenido",
        description: "Generación automática de contenido para redes sociales y blog corporativo",
        benefits: ["Contenido diario automatizado", "Consistencia de marca", "Aumento 60% engagement"],
        implementation: "Calendario de publicaciones, análisis de tendencias, adaptación a cada plataforma."
      },
      {
        name: "Agente de Seguimiento de Ventas",
        description: "Automatización del proceso de seguimiento y nurturing de leads",
        benefits: ["Seguimiento automático de leads", "Incremento 40% conversión", "CRM integrado"],
        implementation: "Secuencias de email personalizadas, scoring de leads, reportes automáticos."
      }
    ];

    setProposedAgents(proposals);
    setCurrentPhase('proposal');

    // Add proposal message
    const proposalMessage = `Basándome en el análisis de tu empresa, he identificado las siguientes oportunidades de automatización:

🎯 **Agentes IA Recomendados para tu Empresa:**

${proposals.map((agent, index) => `
**${index + 1}. ${agent.name}**
${agent.description}

✅ Beneficios:
${agent.benefits.map(benefit => `• ${benefit}`).join('\n')}

🔧 Implementación:
${agent.implementation}
`).join('\n---\n')}

¿Te interesa que desarrollemos alguno de estos agentes específicamente para tu empresa? Puedo crear un plan detallado de implementación.`;

    const aiMessage: Message = {
      id: Date.now().toString(),
      content: proposalMessage,
      sender: "ai",
      session_id: currentChatId!,
      message_type: 'proposal',
      created_at: new Date().toISOString()
    };

    const savedMessage = await saveMessage(aiMessage);
    if (savedMessage) {
      setMessages(prev => [...prev, savedMessage]);
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
    }

    setNewMessage("");
    setLoading(true);

    // Extract business information from user message
    const newBusinessData = { ...businessData };
    if (newMessage.toLowerCase().includes('empresa') || newMessage.toLowerCase().includes('negocio')) {
      newBusinessData.description = newMessage;
    }
    setBusinessData(newBusinessData);

    // Generate AI response
    const aiResponse = await generateAIResponse(newMessage, sessionId);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      sender: "ai",
      session_id: sessionId,
      message_type: currentPhase === 'discovery' ? 'question' : 'standard',
      created_at: new Date().toISOString()
    };

    const savedAiMessage = await saveMessage(aiMessage);
    if (savedAiMessage) {
      setMessages(prev => [...prev, savedAiMessage]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAgentRequest = async (agentName: string) => {
    const message = `Me interesa implementar el ${agentName}. ¿Podrías crear este agente para mi empresa?`;
    setNewMessage(message);
    await handleSend();
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
                  Descubrimiento
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={currentPhase === 'analysis' ? 'default' : 'secondary'}>
                  Análisis
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={currentPhase === 'proposal' ? 'default' : 'secondary'}>
                  Propuesta
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Hola! Soy tu consultor IA</h3>
            <p className="text-muted-foreground mb-6">
              Voy a conocer tu empresa para proponerte agentes IA específicos que optimicen tus procesos.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="font-medium mb-2">Para empezar, cuéntame:</p>
              <p className="text-sm">¿A qué se dedica tu empresa y cuáles son tus principales procesos?</p>
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
              
              {message.message_type === 'proposal' && proposedAgents.length > 0 && (
                <div className="mt-4 space-y-3">
                  {proposedAgents.map((agent, index) => (
                    <Card key={index} className="bg-background">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{agent.name}</h4>
                          <Button
                            size="sm"
                            onClick={() => handleAgentRequest(agent.name)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Crear
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Cuéntame sobre tu empresa y procesos..."
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