import { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Loader2, CheckCircle, XCircle, Plus, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


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
  const [hasOfferedJson, setHasOfferedJson] = useState(false);
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

  // Reset offer flag when chat changes
  useEffect(() => {
    setHasOfferedJson(false);
  }, [currentChatId]);

  // When a new chat has no messages, proactively ask about JSON download
  useEffect(() => {
    if (currentChatId && messages.length === 0 && !hasOfferedJson) {
      const promptMessage: Message = {
        id: Date.now().toString(),
        content:
          "¿Quieres que te descargue el documento JSON para importarlo en n8n y poder utilizar la automatización? Pulsa el botón ‘Crear documento JSON’.",
        sender: "ai",
        ai_type: "n8n",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, promptMessage]);
      saveMessage(promptMessage);
      setHasOfferedJson(true);
    }
  }, [currentChatId, messages.length, hasOfferedJson]);

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
    // 1) Try fenced code block with explicit json
    let match = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error('Error parsing JSON from ```json``` block:', e);
      }
    }

    // 2) Try any fenced code block
    match = content.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error('Error parsing JSON from generic ``` ``` block:', e);
      }
    }

    // 3) Fallback: try to parse the biggest JSON-looking slice
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const jsonCandidate = content.slice(first, last + 1).trim();
      try {
        return JSON.parse(jsonCandidate);
      } catch (e) {
        console.error('Error parsing JSON from braces fallback:', e);
      }
    }

    return null;
  };

  const downloadWorkflowJson = (workflow: any, filename = 'automatizacion-n8n.json') => {
    try {
      const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error creating JSON download:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo preparar la descarga del JSON.'
      });
    }
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
    if (!input.trim() || isLoading) return;

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
    const userInput = input;
    setInput("");
    setIsLoading(true);

    // Guardar mensaje del usuario
    await saveMessage(userMessage);

    try {
      // Call the AI chat function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: userInput,
          sessionId: chatId
        }
      });

      if (error) {
        console.error('Error calling chat-ai function:', error);
        throw new Error(error.message);
      }

      // The AI response is already saved in the database by the edge function
      // Just fetch the updated messages
      await fetchMessages();
      
    } catch (error) {
      console.error('Error in chat:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        sender: "ai",
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  
                  {message.sender === 'ai' && extractWorkflowFromContent(message.content) && (
                    <div
                      className="mt-3 p-3 rounded-lg border bg-background/60 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const wf = extractWorkflowFromContent(message.content);
                        if (wf) downloadWorkflowJson(wf, 'automatizacion-n8n.json');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <FileJson className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">automatizacion-n8n.json</p>
                          <p className="text-xs text-muted-foreground">
                            ¿Quieres descargar el documento JSON para importarlo en n8n? Pulsa aquí.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
      <div className="border-t p-6">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe el proceso que quieres automatizar..."
            disabled={isLoading}
            className="flex-1 h-12 rounded-full px-6 text-base"
          />
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => {
              if (isLoading) return;
              const prompt = "Genera el documento JSON de la automatización listo para importar en n8n. Devuelve solo JSON válido, sin comentarios.";
              setInput(prompt);
              setTimeout(() => handleSend(), 0);
            }}
            className="h-12 rounded-full px-4 gap-2"
          >
            <FileJson className="h-5 w-5" />
            Crear documento JSON
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg" className="rounded-full h-12 w-12 p-0">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}