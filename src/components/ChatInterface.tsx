import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Send, Bot, User, Loader2, Code, CheckCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  aiType?: "chatgpt" | "claude" | "deepseek" | "n8n";
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

export const ChatInterface = ({ onClose }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "¡Hola! Soy tu asistente de automatización IA. Te ayudaré a crear automatizaciones personalizadas para tu empresa. Para comenzar, cuéntame: ¿qué proceso te gustaría automatizar?",
      sender: "ai",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const simulateAIResponse = async (userMessage: string) => {
    setIsLoading(true);

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
      const typingId = `typing-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: typingId,
        content: "",
        sender: "ai",
        aiType: response.ai as any,
        timestamp: new Date(),
        isTyping: true
      }]);

      await new Promise(resolve => setTimeout(resolve, delay));

      // Reemplazar mensaje de "escribiendo..." con respuesta real
      setMessages(prev => prev.map(msg => 
        msg.id === typingId 
          ? { ...msg, content: response.content, isTyping: false }
          : msg
      ));

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

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: `¡Automatización completada! Aquí tienes el código JSON listo para importar en n8n:\n\n\`\`\`json\n${jsonCode}\n\`\`\`\n\n✅ **Workflow validado y optimizado**\n✅ **Listo para importar en n8n**\n✅ **Incluye validaciones integradas**\n\n¿Te gustaría que ajuste algo específico o genere otra automatización?`,
      sender: "ai",
      aiType: "n8n",
      timestamp: new Date()
    }]);

    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    await simulateAIResponse(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Asistente de Automatización IA
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sistema Multi-IA: ChatGPT → Claude → DeepSeek → N8N Assistant
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "ai" && (
                  <div className="flex flex-col items-center gap-1">
                    {getAIIcon(message.aiType)}
                    {message.aiType && (
                      <Badge variant="secondary" className="text-xs">
                        {message.aiType.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
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
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>

                {message.sender === "user" && (
                  <div className="flex items-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
        </CardContent>
      </Card>
    </div>
  );
};