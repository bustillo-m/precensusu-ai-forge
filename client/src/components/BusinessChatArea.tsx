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
  const [currentPhase, setCurrentPhase] = useState<'discovery' | 'analysis' | 'proposal'>('discovery');
  const [businessData, setBusinessData] = useState<{
    company?: string;
    process?: string;
    tools?: string;
    objective?: string;
  }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
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
      text: "¿Cuál es el nombre de tu empresa y a qué se dedica?",
      field: "company" as keyof typeof businessData,
      followUp: "Por favor, proporciona el nombre de tu empresa y describe brevemente tu actividad comercial."
    },
    {
      text: "¿Qué proceso concreto deseas automatizar? Describe brevemente los pasos actuales.",
      field: "process" as keyof typeof businessData,
      followUp: "Necesito más detalles sobre el proceso que quieres automatizar. ¿Podrías describir los pasos específicos?"
    },
    {
      text: "¿Qué sistemas, herramientas o plataformas utilizas actualmente (CRM, ERP, etc.)?",
      field: "tools" as keyof typeof businessData,
      followUp: "Por favor, menciona las herramientas y sistemas específicos que utilizas en tu empresa."
    },
    {
      text: "¿Cuál es el objetivo final que buscas con esta automatización?",
      field: "objective" as keyof typeof businessData,
      followUp: "Describe el resultado que esperas obtener con la automatización. ¿Qué problema resolverá?"
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
      case 'process':
        return cleanResponse.includes('proceso') || cleanResponse.includes('automatizar') ||
               cleanResponse.includes('tarea') || cleanResponse.length > 20;
      case 'tools':
        return cleanResponse.includes('crm') || cleanResponse.includes('erp') ||
               cleanResponse.includes('sistema') || cleanResponse.includes('herramienta') ||
               cleanResponse.includes('software') || cleanResponse.length > 15;
      case 'objective':
        return cleanResponse.includes('objetivo') || cleanResponse.includes('busco') ||
               cleanResponse.includes('quiero') || cleanResponse.includes('mejorar') ||
               cleanResponse.length > 15;
      default:
        return false;
    }
  };

  const askNextQuestion = async (sessionId: string) => {
    console.log('askNextQuestion called with currentQuestion:', currentQuestion, 'total:', discoveryQuestions.length);
    await askNextQuestionByIndex(sessionId, currentQuestion);
  };

  const askNextQuestionByIndex = async (sessionId: string, questionIndex: number) => {
    console.log('askNextQuestionByIndex called with questionIndex:', questionIndex, 'total:', discoveryQuestions.length);
    if (questionIndex >= discoveryQuestions.length) {
      // All questions completed, trigger automation creation
      console.log('All questions completed, triggering automation creation');
      await triggerAutomationCreation(sessionId);
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

  const triggerAutomationCreation = async (sessionId: string) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: `Perfecto! Ya tengo toda la información necesaria:

🏢 **Empresa:** ${businessData.company}
⚙️ **Proceso a automatizar:** ${businessData.process}
🛠️ **Herramientas actuales:** ${businessData.tools}
🎯 **Objetivo:** ${businessData.objective}

Ahora voy a crear tu automatización personalizada utilizando nuestro sistema de IA avanzado. Este proceso puede tomar unos momentos...

🤖 Iniciando creación de automatización...`,
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
      createAutomationFlow(sessionId);
    }, 2000);
  };

  const createAutomationFlow = async (sessionId: string) => {
    setLoading(true);
    try {
      // Get conversation context from all messages
      const conversationContext = `Empresa: ${businessData.company}\nProceso: ${businessData.process}\nHerramientas: ${businessData.tools}\nObjetivo: ${businessData.objective}`;
      
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

      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🎉 ¡Automatización creada exitosamente!

Hemos generado tu automatización personalizada basada en:
• Tu empresa: ${businessData.company}
• Proceso: ${businessData.process}
• Herramientas: ${businessData.tools}
• Objetivo: ${businessData.objective}

El archivo JSON de la automatización ha sido enviado a nuestro equipo para revisión final.

📧 Te contactaremos pronto a ${user.email} con los detalles de implementación.

¡Gracias por confiar en Fluix AI para automatizar tu negocio! 🚀`,
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

    setNewMessage("");
    setLoading(true);

    // If we're not expecting a response, start the questioning flow
    if (!awaitingResponse && currentQuestion === 0) {
      await askNextQuestion(sessionId);
      setLoading(false);
      return;
    }

    // If we're awaiting a response, process the user's answer
    if (awaitingResponse && currentQuestion < discoveryQuestions.length) {
      const currentQuestionData = discoveryQuestions[currentQuestion];
      const isComplete = isResponseComplete(newMessage, currentQuestionData.field);
      
      if (isComplete) {
        // Save the response to business data
        const updatedData = { ...businessData };
        updatedData[currentQuestionData.field] = newMessage;
        setBusinessData(updatedData);
        
        // Move to next question
        const nextQuestionIndex = currentQuestion + 1;
        setCurrentQuestion(nextQuestionIndex);
        setAwaitingResponse(false);
        
        // Ask next question or complete the flow
        setTimeout(async () => {
          // Debug log
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
    } else {
      // General conversation after automation is created
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
    }
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
                <Badge variant={currentQuestion < 4 ? 'default' : 'secondary'}>
                  Consulta ({currentQuestion}/4)
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={currentQuestion >= 4 ? 'default' : 'secondary'}>
                  Automatización
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
            <h3 className="text-lg font-semibold mb-2">¡Hola! Soy tu consultor IA</h3>
            <p className="text-muted-foreground mb-6">
              Te haré algunas preguntas para conocer tu empresa y crear una automatización personalizada.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="font-medium mb-2">📈 Proceso de consulta empresarial:</p>
              <div className="text-sm space-y-1">
                <p>• Te haré 4 preguntas sobre tu empresa</p>
                <p>• Analizaré tu información</p>
                <p>• Crearé tu automatización personalizada</p>
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