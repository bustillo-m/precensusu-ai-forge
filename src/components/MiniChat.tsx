import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Bot, User, X, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export const MiniChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! 👋 Soy tu consultor de IA especializado en automatización empresarial. Te ofrezco una CONSULTORÍA GRATUITA personalizada para analizar tu negocio y recomendarte las mejores automatizaciones. Para empezar, cuéntame: ¿Qué tipo de empresa tienes y cuáles son los procesos que más tiempo te consumen?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectAutomationKeywords = (message: string) => {
    const keywords = [
      'crear agente', 'creame', 'automatizacion', 'automatización', 
      'agente', 'bot', 'crear bot', 'workflow', 'proceso automatico',
      'automatizar', 'generar agente', 'hacer agente'
    ];
    
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  };

  const createAutomation = async () => {
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrate', {
        body: {
          prompt: inputMessage,
          dry_run: false
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🎉 ¡Automatización creada exitosamente!

Workflow ID: ${data.workflow_id}

📊 **Resumen de ejecución:**
${data.execution_summary.message}

🤖 **Modelos utilizados:** ${data.models_used.join(', ')}

El workflow ha sido guardado y está listo para usar.`,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('Error creating automation:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, hubo un error al crear la automatización. Por favor, intenta de nuevo.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Check if user wants to create automation
    if (detectAutomationKeywords(inputMessage)) {
      const suggestionMessage: Message = {
        id: (Date.now() + 0.5).toString(),
        text: '🤖 He detectado que quieres crear una automatización. Te recomiendo usar el botón "Crear Automatización" para un proceso más completo y eficiente.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, suggestionMessage]);
      setInputMessage('');
      return;
    }
    
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: inputMessage,
          sessionId: 'landing-page-chat'
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Lo siento, hubo un error al procesar tu mensaje.',
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, intenta de nuevo.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg hover:scale-110 transition-transform"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        <div className="absolute -top-12 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm whitespace-nowrap animate-pulse">
          ¡Consultoría IA Gratuita!
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px]">
      <Card className="shadow-2xl border-2 h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Consultoría IA Gratuita</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-muted/30 rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                {message.isBot && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.isBot
                      ? 'bg-background border text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {message.text}
                </div>
                {!message.isBot && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-background border px-3 py-2 rounded-lg text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Fixed input area at bottom */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-4 mt-4 border-t">
            <div className="flex gap-2 mb-2">
              <Button
                onClick={createAutomation}
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
                variant="outline"
                className="px-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                🤖 Crear Automatización
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Cuéntame sobre tu empresa o describe la automatización que necesitas..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};