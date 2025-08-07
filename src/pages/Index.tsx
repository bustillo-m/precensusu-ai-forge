import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, Zap, Users, ArrowRight, Bot, Code, Cog, Upload, Target, TrendingUp, Clock, Shield, Mail, Phone, FileText, Calendar, Database, BarChart3 } from "lucide-react";
import { JsonUploader } from "@/components/JsonUploader";
import { HeroChat } from "@/components/HeroChat";
import logoImage from "@/assets/precensus-ai-logo.png";

const Index = () => {
  const [showUploader, setShowUploader] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img 
              src={logoImage} 
              alt="Precensus AI Logo" 
              className="h-24 w-auto"
            />
            <h1 className="text-3xl font-bold">Precensus AI</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#services" className="text-muted-foreground hover:text-foreground">Servicios</a>
            <a href="#utilities" className="text-muted-foreground hover:text-foreground">Utilidades</a>
            <a href="#utilities" className="text-muted-foreground hover:text-foreground">Utilidades</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground">Nosotros</a>
          </nav>
          <div className="flex gap-2">
            <Button onClick={() => setShowUploader(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Subir JSON
            </Button>
            <Button onClick={() => window.location.href = '/auth'} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Iniciar Sesión / Chat IA
            </Button>
          </div>
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
        
        {/* Hero Chat */}
        <HeroChat />
        
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <Button size="lg" onClick={() => window.location.href = '/auth'} className="gap-2">
            <Zap className="h-5 w-5" />
            Comenzar Automatización
          </Button>
          <Button size="lg" variant="outline" onClick={() => setShowUploader(true)} className="gap-2">
            <Upload className="h-5 w-5" />
            Subir JSON a n8n
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

      {/* Agent Utilities Section */}
      <section id="utilities" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Utilidades de Nuestros Agentes</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre todo lo que puedes automatizar con nuestros agentes inteligentes. Ejemplos reales de aplicación.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Customer Service Agent */}
            <Card className="h-full">
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Agente de Atención al Cliente</CardTitle>
                <CardDescription>
                  Automatiza respuestas y gestiona consultas 24/7
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Respuestas automáticas por WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Conecta con tu CRM y responde consultas de productos instantáneamente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Escalamiento inteligente</p>
                      <p className="text-xs text-muted-foreground">Deriva casos complejos a humanos automáticamente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Historial de conversaciones</p>
                      <p className="text-xs text-muted-foreground">Mantiene contexto y guarda todas las interacciones</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Agent */}
            <Card className="h-full">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Agente de Ventas</CardTitle>
                <CardDescription>
                  Califica leads y automatiza seguimiento de prospectos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Calificación automática de leads</p>
                      <p className="text-xs text-muted-foreground">Analiza formularios web y asigna puntuación de interés</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Emails de seguimiento personalizados</p>
                      <p className="text-xs text-muted-foreground">Envía secuencias basadas en comportamiento del usuario</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Reportes de conversión</p>
                      <p className="text-xs text-muted-foreground">Dashboard con métricas de pipeline y forecasting</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operations Agent */}
            <Card className="h-full">
              <CardHeader>
                <Cog className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Agente de Operaciones</CardTitle>
                <CardDescription>
                  Optimiza procesos internos y gestiona tareas repetitivas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Procesamiento de facturas</p>
                      <p className="text-xs text-muted-foreground">Extrae datos, valida información y actualiza sistemas contables</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Gestión de inventario</p>
                      <p className="text-xs text-muted-foreground">Monitorea stock y genera órdenes de compra automáticamente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Reportes ejecutivos</p>
                      <p className="text-xs text-muted-foreground">Consolida datos de múltiples fuentes en dashboards</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marketing Agent */}
            <Card className="h-full">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Agente de Marketing</CardTitle>
                <CardDescription>
                  Automatiza campañas y personaliza experiencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Segmentación automática</p>
                      <p className="text-xs text-muted-foreground">Clasifica clientes por comportamiento y envía contenido personalizado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Campañas multicanal</p>
                      <p className="text-xs text-muted-foreground">Coordina email, SMS y redes sociales desde un solo flujo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Análisis de rendimiento</p>
                      <p className="text-xs text-muted-foreground">Optimiza campañas basado en métricas de engagement</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HR Agent */}
            <Card className="h-full">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Agente de Recursos Humanos</CardTitle>
                <CardDescription>
                  Gestiona talento y automatiza procesos de RRHH
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Screening de candidatos</p>
                      <p className="text-xs text-muted-foreground">Analiza CVs y programa entrevistas automáticamente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Onboarding automatizado</p>
                      <p className="text-xs text-muted-foreground">Guía nuevos empleados y asigna tareas de integración</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Evaluaciones de desempeño</p>
                      <p className="text-xs text-muted-foreground">Recopila feedback 360° y genera reportes de desarrollo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finance Agent */}
            <Card className="h-full">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Agente Financiero</CardTitle>
                <CardDescription>
                  Automatiza contabilidad y análisis financiero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Conciliación bancaria</p>
                      <p className="text-xs text-muted-foreground">Importa extractos y reconcilia transacciones automáticamente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Alertas de cash flow</p>
                      <p className="text-xs text-muted-foreground">Monitorea liquidez y notifica sobre riesgos financieros</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Reportes regulatorios</p>
                      <p className="text-xs text-muted-foreground">Genera declaraciones fiscales y reportes de cumplimiento</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Use Cases Examples */}
          <div className="bg-background rounded-lg p-8 border">
            <h4 className="text-2xl font-bold text-center mb-8">Casos de Uso Reales</h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h5 className="text-lg font-semibold text-primary">E-commerce</h5>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Seguimiento automático de pedidos</p>
                      <p className="text-sm text-muted-foreground">Notifica a clientes sobre el estado de envío vía WhatsApp/Email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gestión de devoluciones</p>
                      <p className="text-sm text-muted-foreground">Procesa solicitudes de reembolso y actualiza inventario automáticamente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Recuperación de carritos abandonados</p>
                      <p className="text-sm text-muted-foreground">Envía emails personalizados con descuentos para recuperar ventas</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h5 className="text-lg font-semibold text-primary">Servicios Profesionales</h5>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Programación inteligente de citas</p>
                      <p className="text-sm text-muted-foreground">Coordina calendarios múltiples y envía recordatorios automatizados</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Generación de propuestas</p>
                      <p className="text-sm text-muted-foreground">Crea cotizaciones personalizadas basadas en templates y datos del cliente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Seguimiento de facturas</p>
                      <p className="text-sm text-muted-foreground">Envía recordatorios de pago y gestiona cobranza automáticamente</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button size="lg" onClick={() => window.location.href = '/auth'} className="gap-2">
                <ArrowRight className="h-5 w-5" />
                Crear Mi Primer Agente
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">¿Listo para Automatizar tu Empresa?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Comienza con una consultoría gratuita personalizada. Nuestro asistente de IA analizará tu negocio y te recomendará las mejores automatizaciones.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" onClick={() => window.location.href = '/auth'} className="gap-2">
              <MessageSquare className="h-5 w-5" />
              Consultoría IA Gratuita
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary gap-2">
              <Phone className="h-5 w-5" />
              Llamada con Experto
            </Button>
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

      {/* JSON Uploader */}
      {showUploader && <JsonUploader onClose={() => setShowUploader(false)} />}
    </div>
  );
};

export default Index;
