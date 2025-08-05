import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, Zap, Users, ArrowRight, Bot, Code, Cog } from "lucide-react";
import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Precensus AI</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#services" className="text-muted-foreground hover:text-foreground">Servicios</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Precios</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground">Nosotros</a>
          </nav>
          <Button onClick={() => setShowChat(true)} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Probar Chat IA
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          IA Empresarial • Automatización Inteligente
        </Badge>
        <h2 className="text-5xl font-bold mb-6 gradient-text">
          Transformamos tu negocio con
          <br />
          <span className="text-primary">Inteligencia Artificial</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Implementamos chatbots y automatizaciones personalizadas que revolucionan la eficiencia de tu empresa. 
          Nuestro sistema multi-IA genera código JSON optimizado para n8n.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" onClick={() => setShowChat(true)} className="gap-2">
            <Zap className="h-5 w-5" />
            Comenzar Automatización
          </Button>
          <Button size="lg" variant="outline">
            <Users className="h-5 w-5 mr-2" />
            Solicitar Consultoría
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Nuestros Servicios</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Soluciones de IA personalizadas para cada necesidad empresarial
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Chatbots Inteligentes</CardTitle>
                <CardDescription>
                  Asistentes virtuales que entienden y responden como humanos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Procesamiento de lenguaje natural
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Integración con sistemas existentes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Aprendizaje continuo
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Cog className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Automatizaciones n8n</CardTitle>
                <CardDescription>
                  Flujos de trabajo inteligentes generados por múltiples IAs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Generación automática de JSON
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Optimización multi-IA
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Validación integrada
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Consultoría IA</CardTitle>
                <CardDescription>
                  Estrategia personalizada para implementar IA en tu empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Análisis de procesos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Implementación guiada
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Soporte continuo
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Workflow Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Proceso Multi-IA</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nuestro sistema utiliza múltiples IAs especializadas para crear la automatización perfecta
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">1. ChatGPT</h4>
              <p className="text-sm text-muted-foreground">Genera el esquema base de automatización</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Cog className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">2. Claude</h4>
              <p className="text-sm text-muted-foreground">Ajusta condicionales y estructura JSON</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">3. DeepSeek</h4>
              <p className="text-sm text-muted-foreground">Optimiza la lógica y eficiencia</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">4. N8N Assistant</h4>
              <p className="text-sm text-muted-foreground">Produce JSON final validado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Planes y Precios</h3>
            <p className="text-muted-foreground">Elige el plan que mejor se adapte a tu empresa</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Freemium</CardTitle>
                <CardDescription>Acceso básico al chat</CardDescription>
                <div className="text-3xl font-bold">$0</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Chat con IA
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-4 w-4 rounded-full border border-muted-foreground/30"></span>
                    Sin asesoría empresarial
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-4 w-4 rounded-full border border-muted-foreground/30"></span>
                    Sin agentes
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Comenzar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Started</CardTitle>
                <CardDescription>Para empezar</CardDescription>
                <div className="text-3xl font-bold">$149</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    1 Consultoría IA
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    1 Automatización simple
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Importación directa n8n
                  </li>
                </ul>
                <Button className="w-full mt-6">Comenzar</Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <Badge className="w-fit mb-2">Más Popular</Badge>
                <CardTitle>Pro</CardTitle>
                <CardDescription>Para empresas en crecimiento</CardDescription>
                <div className="text-3xl font-bold">$299</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    4 Asesorías IA
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    3 Agentes/Automatizaciones
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Chat ilimitado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Importación directa n8n
                  </li>
                </ul>
                <Button className="w-full mt-6">Comenzar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Para empresas establecidas</CardDescription>
                <div className="text-3xl font-bold">$599</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    4 Automatizaciones simples
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    1 Automatización avanzada
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Importación directa n8n
                  </li>
                </ul>
                <Button className="w-full mt-6">Comenzar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Para grandes corporaciones</CardDescription>
                <div className="text-3xl font-bold">$1,229</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    7 Automatizaciones simples
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    3 Automatizaciones avanzadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Importación directa n8n
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Revisión humana
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Contactar</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Precensus AI</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Transformando empresas con Inteligencia Artificial
          </p>
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Términos</a>
            <a href="#" className="hover:text-foreground">Privacidad</a>
            <a href="#" className="hover:text-foreground">Contacto</a>
          </div>
        </div>
      </footer>

      {/* Chat Interface */}
      {showChat && <ChatInterface onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default Index;
