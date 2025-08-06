import { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Loader2, CheckCircle, XCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  ai_type?: "chatgpt" | "claude" | "deepseek" | "n8n";
  workflow_status?: 'sending' | 'success' | 'error';
  workflow_error?: string;
  workflow_id?: string;
  created_at: string;
  isTyping?: boolean;
}

interface ChatAreaProps {
  user: User;
  currentChatId: string | null;
  onCreateChat: (title?: string) => Promise<string | null>;
}

export function ChatArea({ user, currentChatId, onCreateChat }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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

      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const saveMessage = async (message: Omit<Message, "id" | "created_at">) => {
    if (!currentChatId) return null;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_session_id: currentChatId,
          content: message.content,
          sender: message.sender,
          ai_type: message.ai_type,
          workflow_status: message.workflow_status,
          workflow_id: message.workflow_id,
          workflow_error: message.workflow_error,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  };

  const aiResponses = {
    step1: {
      ai: "chatgpt",
      content: "Perfecto! He analizado tu solicitud y voy a generar el esquema base de automatización. Dame un momento mientras proceso esta información..."
    },
    step2: {
      ai: "claude",
      content: "Excelente esquema base de ChatGPT. Ahora voy a ajustar los condicionales, bucles y optimizar la estructura JSON para que sea más eficiente..."
    },
    step3: {
      ai: "deepseek",
      content: "Revisando la lógica propuesta por Claude... Puedo optimizar el orden de ejecución y mejorar la eficiencia del flujo. Aplicando mejoras..."
    },
    step4: {
      ai: "n8n",
      content: "¡Perfecto! He tomado toda la información optimizada y he generado el JSON final validado para n8n. El workflow está listo para importar."
    }
  };

  const getAIIcon = (aiType?: string) => {
    switch (aiType) {
      case "chatgpt":
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>;
      case "claude":
        return <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>;
      case "deepseek":
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>;
      case "n8n":
        return <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">N</div>;
      default:
        return <Bot className="w-6 h-6 text-primary" />;
    }
  };

  const sendWorkflowToN8n = async (workflowJson: any, messageId: string) => {
    try {
      // Update message status to sending
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, workflow_status: 'sending' } 
          : msg
      ));

      const { data, error } = await supabase.functions.invoke('send-to-n8n', {
        body: { workflow: workflowJson }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                workflow_status: 'success',
                workflow_id: data.workflowId,
                content: msg.content + `\n\n🎉 ${data.message}`
              } 
            : msg
        ));
        
        toast({
          title: "¡Éxito!",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error sending to n8n:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              workflow_status: 'error',
              workflow_error: error.message,
              content: msg.content + `\n\n❌ Error al enviar a n8n: ${error.message}`
            } 
          : msg
      ));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo enviar la automatización a n8n: ${error.message}`,
      });
    }
  };

  const extractWorkflowFromContent = (content: string) => {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return null;
      }
    }
    return null;
  };

  const simulateAIResponse = async (userMessage: string, chatId: string) => {
    setIsLoading(true);
    setCurrentStep(1);

    // Simular procesamiento por múltiples IAs
    const steps = [
      { delay: 2000, step: "step1" as keyof typeof aiResponses },
      { delay: 3000, step: "step2" as keyof typeof aiResponses },
      { delay: 2500, step: "step3" as keyof typeof aiResponses },
      { delay: 3500, step: "step4" as keyof typeof aiResponses }
    ];

    for (let i = 0; i < steps.length; i++) {
      const { delay, step } = steps[i];
      const response = aiResponses[step];
      
      // Mostrar mensaje de "escribiendo..."
      const typingId = `typing-${Date.now()}-${i}`;
      const typingMessage: Message = {
        id: typingId,
        content: "",
        sender: "ai",
        ai_type: response.ai as any,
        created_at: new Date().toISOString(),
        isTyping: true
      };

      setMessages(prev => [...prev, typingMessage]);

      await new Promise(resolve => setTimeout(resolve, delay));

      // Reemplazar mensaje de "escribiendo..." con respuesta real
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: response.content,
        sender: "ai",
        ai_type: response.ai as any,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => prev.map(msg => 
        msg.id === typingId ? aiMessage : msg
      ));

      // Guardar en la base de datos
      await saveMessage(aiMessage);
      setCurrentStep(i + 2);
    }

    // Generar JSON final
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jsonCode = `{
  "name": "Automatización Personalizada",
  "nodes": [
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "condition1",
              "leftValue": "{{ $json.trigger }}",
              "rightValue": "nuevo_cliente",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ]
        }
      },
      "id": "node1",
      "name": "Condición Inicial",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {},
  "active": true,
  "settings": {},
  "versionId": "1.0"
}`;

    const finalMessage: Message = {
      id: Date.now().toString(),
      content: `¡Automatización completada! Aquí tienes el código JSON listo para importar en n8n:\n\n\`\`\`json\n${jsonCode}\n\`\`\`\n\n✅ **Workflow validado y optimizado**\n✅ **Listo para importar en n8n**\n✅ **Incluye validaciones integradas**\n\n¿Te gustaría que ajuste algo específico o genere otra automatización?`,
      sender: "ai",
      ai_type: "n8n",
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, finalMessage]);

    // Guardar el mensaje final
    const savedMessage = await saveMessage(finalMessage);

    // Extract and send workflow to n8n
    const workflow = extractWorkflowFromContent(finalMessage.content);
    if (workflow && savedMessage) {
      // Wait a moment for the message to be displayed
      setTimeout(() => {
        sendWorkflowToN8n(workflow, savedMessage.id);
      }, 1000);
    }

    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let chatId = currentChatId;
    
    // Create new chat if none exists
    if (!chatId) {
      const title = input.length > 50 ? input.substring(0, 50) + "..." : input;
      chatId = await onCreateChat(title);
      if (!chatId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear la conversación.",
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Guardar mensaje del usuario
    await saveMessage(userMessage);

    // Si es el primer mensaje, mostrar mensaje de bienvenida primero
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        content: "¡Hola! Soy tu asistente de automatización IA. Te ayudaré a crear automatizaciones personalizadas para tu empresa usando un sistema multi-IA (ChatGPT → Claude → DeepSeek → N8N Assistant). Para comenzar, cuéntame: ¿qué proceso te gustaría automatizar?",
        sender: "ai",
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, welcomeMessage]);
      await saveMessage(welcomeMessage);
    }

    await simulateAIResponse(input, chatId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentChatId && messages.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">¡Bienvenido a Precensus AI!</h2>
              <p className="text-muted-foreground">
                Tu asistente de automatización inteligente está listo para ayudarte. 
                Crea una nueva conversación para comenzar.
              </p>
            </div>
            <Button onClick={() => onCreateChat()} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Comenzar nueva conversación
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">Asistente de Automatización IA</h1>
            <p className="text-sm text-muted-foreground">
              Sistema Multi-IA: ChatGPT → Claude → DeepSeek → N8N Assistant
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        {isLoading && (
          <div className="flex gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs">ChatGPT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-300'}`} />
              <span className="text-xs">Claude</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <span className="text-xs">DeepSeek</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${currentStep >= 4 ? 'bg-purple-500' : 'bg-gray-300'}`} />
              <span className="text-xs">N8N</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "ai" && (
              <div className="flex flex-col items-center gap-1">
                {getAIIcon(message.ai_type)}
                {message.ai_type && (
                  <Badge variant="secondary" className="text-xs">
                    {message.ai_type.toUpperCase()}
                  </Badge>
                )}
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.isTyping ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Workflow status indicator */}
                  {message.sender === 'ai' && message.ai_type === 'n8n' && message.workflow_status && (
                    <div className="mt-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {message.workflow_status === 'sending' && (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-sm text-blue-600">Enviando automatización a n8n...</span>
                          </>
                        )}
                        {message.workflow_status === 'success' && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Automatización enviada exitosamente</span>
                            {message.workflow_id && (
                              <span className="text-xs text-muted-foreground">(ID: {message.workflow_id})</span>
                            )}
                          </>
                        )}
                        {message.workflow_status === 'error' && (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">Error al enviar automatización</span>
                            {message.workflow_error && (
                              <span className="text-xs text-muted-foreground">({message.workflow_error})</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {message.sender === "user" && (
              <div className="flex items-center">
                <UserIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe el proceso que quieres automatizar..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}