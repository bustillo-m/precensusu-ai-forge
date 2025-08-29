import { useState, useRef, useEffect } from "react";

interface User {
  id: string;
  email: string;
  username: string;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Loader2, CheckCircle, XCircle, Plus, FileJson, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({ email: '', phone: '' });
  const [isCreatingAutomation, setIsCreatingAutomation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    // Method 1: Use the container ID
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
    
    // Method 2: Use the ref as fallback
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
    // Also scroll after a small delay to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-scroll when form states change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [showCreateButton, showContactForm, isCreatingAutomation]);

  // Auto-scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/chat-sessions/${currentChatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Error fetching messages:", response.statusText);
        return;
      }

      const data = await response.json();
      setMessages(data as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const saveMessage = async (message: Omit<Message, "id" | "created_at">) => {
    if (!currentChatId) return null;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const response = await fetch(`/api/chat-sessions/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: message.content,
          sender: message.sender,
          ai_type: message.ai_type,
          workflow_status: message.workflow_status,
          workflow_id: message.workflow_id,
          workflow_error: message.workflow_error,
        })
      });

      if (!response.ok) {
        console.error("Error saving message:", response.statusText);
        return null;
      }

      const data = await response.json();
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

      // For now, simulate the n8n integration
      const data = {
        success: true,
        message: "Workflow exportado correctamente como JSON",
        workflowId: "generated-" + Date.now()
      };

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
        throw new Error('Error desconocido');
      }
    } catch (error) {
      console.error('Error sending to n8n:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              workflow_status: 'error',
              workflow_error: errorMessage,
              content: msg.content + `\n\n❌ Error al enviar a n8n: ${errorMessage}`
            } 
          : msg
      ));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo enviar la automatización a n8n: ${errorMessage}`,
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

    // Force scroll to bottom immediately after sending
    setTimeout(scrollToBottom, 50);

    // Guardar mensaje del usuario
    await saveMessage(userMessage);

    try {
      // Call the AI chat function
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userInput,
          sessionId: chatId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la respuesta del AI');
      }

      const data = await response.json();
      
      // Check if AI wants to show create button
      if (data.showCreateButton) {
        setShowCreateButton(true);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "ai",
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessage(aiMessage);
      
      // Force scroll to bottom after AI response
      setTimeout(scrollToBottom, 50);
      
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

  const handleCreateAutomation = () => {
    setShowContactForm(true);
    setShowCreateButton(false);
  };

  const handleSubmitContactForm = async () => {
    if (!contactData.email || !contactData.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos.",
      });
      return;
    }

    setIsCreatingAutomation(true);
    setShowContactForm(false);

    try {
      // Get conversation context from messages
      const conversationContext = messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n\n');

      const response = await fetch('/api/create-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationContext,
          email: contactData.email,
          phone: contactData.phone
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `✅ **¡Automatización creada exitosamente!**

Hemos generado tu workflow personalizado usando nuestro sistema de 4 IAs especializadas y lo hemos enviado por email para revisión.

📧 **¿Qué sigue ahora?**
- Nuestro equipo técnico revisará tu automatización
- Te contactaremos en las próximas horas al ${contactData.phone}
- Recibirás el archivo JSON final por email una vez validado

**¡En breve nos pondremos en contacto contigo!**

Gracias por confiar en Fluix AI para automatizar tu negocio. 🚀`,
          sender: "ai",
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, successMessage]);
        await saveMessage(successMessage);

        toast({
          title: "¡Éxito!",
          description: "Automatización creada. Te contactaremos pronto.",
        });
      } else {
        throw new Error(data.error || 'Error creando automatización');
      }
    } catch (error) {
      console.error('Error creating automation:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: '❌ Hubo un error al crear la automatización. Por favor, inténtalo de nuevo o contacta con soporte.',
        sender: "ai",
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la automatización.",
      });
    } finally {
      setIsCreatingAutomation(false);
      setContactData({ email: '', phone: '' });
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
              <h2 className="text-2xl font-bold mb-2">¡Bienvenido a Fluix AI!</h2>
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
      <div className="border-b p-4 flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" id="messages-container">
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
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className="flex-shrink-0">
        {/* Intelligent Create Automation Button */}
        {showCreateButton && !showContactForm && !isCreatingAutomation && (
          <div className="border-t bg-gradient-to-r from-primary/10 to-accent/10 p-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Los 3 pasos están completos</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  🚀 ¡Crear Automatización Inteligente!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Sistema Multi-IA activado. ChatGPT → Claude → DeepSeek → N8N
                </p>
                <Button 
                  onClick={handleCreateAutomation} 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Iniciar Creación Automática
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Proceso automático sin intervención manual
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Form */}
        {showContactForm && (
          <div className="border-t bg-primary/5 p-6">
            <div className="max-w-md mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border">
                <h3 className="text-lg font-semibold mb-4">📧 Datos de contacto</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData({...contactData, email: e.target.value})}
                      placeholder="tu@email.com"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono</label>
                    <Input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                      placeholder="+34 123 456 789"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSubmitContactForm} className="flex-1">
                      Enviar y Crear
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowContactForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Creating Automation Loading */}
        {isCreatingAutomation && (
          <div className="border-t bg-primary/5 p-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">🔄 Generando automatización...</h3>
                <p className="text-muted-foreground">
                  Nuestras 4 IAs están trabajando en tu workflow personalizado
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input - Always visible at bottom */}
        {!showContactForm && !isCreatingAutomation && (
          <div className="border-t p-6 bg-background">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe el proceso que quieres automatizar..."
                disabled={isLoading}
                className="flex-1 h-12 rounded-full px-6 text-base"
                data-testid="input-chat-message"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                size="lg" 
                className="rounded-full h-12 w-12 p-0"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}