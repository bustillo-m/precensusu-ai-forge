import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Code, Upload, Shield, Mail, Calendar, Database, FileText, Bot, Zap, Users, Cpu, Workflow, Brain, Target, ArrowRight } from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { AutomationForm } from "@/components/AutomationForm";
import logoImage from "@/assets/Captura_de_pantalla_2025-08-21_120039-removebg-preview.png";

export default function Index() {
  useEffect(() => {
    document.title = "Precensusu AI — Automatiza procesos con IA";
    // Structured data
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Precensusu AI",
      url: "https://precensusu.ai/",
      sameAs: ["https://www.linkedin.com", "https://www.tiktok.com"],
      slogan: "Automatiza procesos con agentes de IA sin código",
    });
    document.head.appendChild(ld);
    return () => { document.head.removeChild(ld); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent text-white font-inter">
      {/* Modern Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Precensusu AI Logo" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Precensusu AI
            </span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#beneficios" className="text-white/80 hover:text-white transition-colors duration-300 font-medium">Beneficios</a>
            <a href="#como-funciona" className="text-white/80 hover:text-white transition-colors duration-300 font-medium">Cómo funciona</a>
            <a href="#casos" className="text-white/80 hover:text-white transition-colors duration-300 font-medium">Casos de uso</a>
            <a href="#precios" className="text-white/80 hover:text-white transition-colors duration-300 font-medium">Planes</a>
          </nav>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/business-chat'} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold"
              variant="outline"
            >
              <Bot className="h-4 w-4 mr-2" />
              Consultor IA
            </Button>
            <Button 
              onClick={() => document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' })} 
              className="bg-accent hover:bg-accent/90 text-white font-semibold"
            >
              Solicitar demo
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Futuristic Hero Section */}
        <section className="relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          <div className="container mx-auto px-4 py-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    <Zap className="h-4 w-4 text-accent" />
                    IA Empresarial Avanzada
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                    Automatiza tu empresa con{" "}
                    <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                      Inteligencia Artificial
                    </span>
                  </h1>
                  <p className="text-xl text-white/80 max-w-2xl leading-relaxed">
                    Transformamos procesos empresariales en flujos inteligentes. Nuestros agentes de IA especializados optimizan operaciones, mejoran la productividad y potencian el crecimiento de tu equipo.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="bg-accent/20 p-2 rounded-full">
                      <Brain className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Multi-IA Avanzada</p>
                      <p className="text-sm text-white/70">ChatGPT + Claude + DeepSeek</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="bg-accent/20 p-2 rounded-full">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Para Empresas</p>
                      <p className="text-sm text-white/70">Equipos más eficientes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="bg-accent/20 p-2 rounded-full">
                      <Workflow className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Sin Código</p>
                      <p className="text-sm text-white/70">Implementación inmediata</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <div className="bg-accent/20 p-2 rounded-full">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Resultados Medibles</p>
                      <p className="text-sm text-white/70">ROI comprobado</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' })}
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 text-lg"
                  >
                    Comenzar Ahora
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/business-chat'}
                    variant="outline" 
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    Consultar IA Gratis
                  </Button>
                </div>
              </div>

              {/* Modern Form Card */}
              <div id="hero-form" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <Cpu className="h-4 w-4 text-accent" />
                    Demo Personalizada
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Descubre el Poder de la IA</h2>
                  <p className="text-white/80">Te mostramos cómo automatizar tu empresa en 30 minutos</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-6">
                  <LeadForm ctaText="Solicitar Demo Gratuita" />
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-white/60">✓ Sin compromiso ✓ Consulta especializada ✓ Resultados inmediatos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="bg-white text-primary py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Zap className="h-4 w-4 text-primary" />
                Beneficios Empresariales
              </div>
              <h2 className="text-4xl font-bold mb-4">Transforma tu empresa con IA</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Potencia a tus empleados con automatizaciones inteligentes que liberan tiempo para tareas estratégicas
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="group hover:scale-105 transition-transform duration-300">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors duration-300">
                  <CardHeader className="text-center p-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-3">Implementación Rápida</CardTitle>
                    <CardDescription className="text-base">
                      Automatizaciones listas en minutos. Reduce el tiempo de implementación de semanas a horas.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="group hover:scale-105 transition-transform duration-300">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors duration-300">
                  <CardHeader className="text-center p-8">
                    <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors duration-300">
                      <Users className="h-8 w-8 text-accent" />
                    </div>
                    <CardTitle className="text-xl mb-3">Equipos Más Eficientes</CardTitle>
                    <CardDescription className="text-base">
                      Libera a tus empleados de tareas repetitivas para que se enfoquen en innovación y crecimiento.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="group hover:scale-105 transition-transform duration-300">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors duration-300">
                  <CardHeader className="text-center p-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-3">IA Multi-Modelo</CardTitle>
                    <CardDescription className="text-base">
                      Combinamos ChatGPT, Claude y DeepSeek para obtener los mejores resultados en cada proceso.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              <div className="group hover:scale-105 transition-transform duration-300">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors duration-300">
                  <CardHeader className="text-center p-8">
                    <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors duration-300">
                      <Shield className="h-8 w-8 text-accent" />
                    </div>
                    <CardTitle className="text-xl mb-3">Soporte Especializado</CardTitle>
                    <CardDescription className="text-base">
                      Acompañamiento completo desde la implementación hasta la optimización continua.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">80%</div>
                <p className="text-muted-foreground">Reducción en tareas repetitivas</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">24/7</div>
                <p className="text-muted-foreground">Operación continua</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">15min</div>
                <p className="text-muted-foreground">Implementación promedio</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">100+</div>
                <p className="text-muted-foreground">Empresas automatizadas</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="como-funciona" className="bg-gradient-to-br from-primary/5 to-accent/5 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Workflow className="h-4 w-4 text-primary" />
                Proceso Inteligente
              </div>
              <h2 className="text-4xl font-bold mb-4 text-primary">Cómo automatizamos tu empresa</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Proceso optimizado con IA para crear automatizaciones empresariales en tiempo récord
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold">1</div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">Consulta Inicial</h3>
                <p className="text-muted-foreground">Nuestro consultor IA analiza tus procesos y define los objetivos de automatización</p>
              </div>

              <div className="text-center group">
                <div className="bg-accent/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                  <div className="bg-accent text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold">2</div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-accent">Diseño con IA</h3>
                <p className="text-muted-foreground">ChatGPT, Claude y DeepSeek crean colaborativamente la solución óptima</p>
              </div>

              <div className="text-center group">
                <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold">3</div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">Optimización</h3>
                <p className="text-muted-foreground">Refinamos y probamos cada flujo para máxima eficiencia y confiabilidad</p>
              </div>

              <div className="text-center group">
                <div className="bg-accent/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                  <div className="bg-accent text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold">4</div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-accent">Implementación</h3>
                <p className="text-muted-foreground">Entregamos JSON listo para n8n y acompañamos la puesta en marcha</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <div className="bg-white/50 backdrop-blur-sm border border-primary/20 rounded-3xl p-8 inline-block">
                <div className="flex items-center gap-4 text-lg font-semibold text-primary">
                  <Clock className="h-6 w-6" />
                  Tiempo promedio: 15-30 minutos
                  <ArrowRight className="h-6 w-6 text-accent" />
                  <Target className="h-6 w-6" />
                  Resultado: Automatización funcional
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section id="casos" className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Target className="h-4 w-4 text-primary" />
                Casos de Éxito
              </div>
              <h2 className="text-4xl font-bold mb-4 text-primary">Automatizaciones que transforman empresas</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Descubre cómo nuestros agentes de IA optimizan operaciones en diferentes sectores
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {/* E-commerce */}
              <div className="group">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="p-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mb-4 text-primary">E-commerce</CardTitle>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">Seguimiento automático</p>
                          <p className="text-sm text-muted-foreground">Notificaciones inteligentes de pedidos y envíos</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">Gestión de inventario</p>
                          <p className="text-sm text-muted-foreground">Control automático de stock y reposición</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">Recuperación de carritos</p>
                          <p className="text-sm text-muted-foreground">Campañas automáticas personalizadas</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Servicios Profesionales */}
              <div className="group">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="p-8">
                    <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                      <Users className="h-8 w-8 text-accent" />
                    </div>
                    <CardTitle className="text-2xl mb-4 text-accent">Servicios Profesionales</CardTitle>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Programación inteligente</p>
                          <p className="text-sm text-muted-foreground">Optimización automática de calendarios</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Generación de documentos</p>
                          <p className="text-sm text-muted-foreground">Propuestas y contratos automáticos</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Seguimiento financiero</p>
                          <p className="text-sm text-muted-foreground">Control automático de facturas y cobros</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* RRHH y Operaciones */}
              <div className="group">
                <Card className="h-full border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="p-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                      <Workflow className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mb-4 text-primary">RRHH y Operaciones</CardTitle>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">Onboarding automático</p>
                          <p className="text-sm text-muted-foreground">Integración perfecta de nuevos empleados</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">Evaluaciones inteligentes</p>
                          <p className="text-sm text-muted-foreground">Análisis automático de rendimiento</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-accent/20 p-1 rounded-full mt-1">
                          <CheckCircle className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">Gestión de procesos</p>
                          <p className="text-sm text-muted-foreground">Optimización de flujos operativos</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Lo que dicen nuestros clientes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card><CardHeader><CardDescription>“Implementamos en 2 días lo que antes tardaba semanas.”</CardDescription><CardTitle className="mt-2">María G.</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardDescription>“El JSON para n8n funcionó a la primera. Ahorro brutal.”</CardDescription><CardTitle className="mt-2">Carlos R.</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardDescription>“Soporte excelente y resultados inmediatos.”</CardDescription><CardTitle className="mt-2">Ana S.</CardTitle></CardHeader></Card>
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="precios" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Cómo empezar</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Consultoría IA gratuita</CardTitle>
                  <CardDescription>Evaluamos tus procesos y definimos el alcance.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>2. Entrega de agentes/automatizaciones</CardTitle>
                  <CardDescription>Paquetes mensuales con soporte.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>3. Planes personalizados</CardTitle>
                  <CardDescription>Adaptamos la propuesta a tu empresa.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Automation Form */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Crea tu Automatización</h2>
              <p className="text-muted-foreground">Describe lo que quieres automatizar y generamos el workflow de n8n para ti</p>
            </div>
            <AutomationForm />
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-6">¿Listo para empezar?</h2>
              <p className="text-center mb-6 opacity-90">Solicita tu demo o cuéntanos qué quieres automatizar.</p>
              <div className="bg-card text-card-foreground border rounded-lg p-6">
                <LeadForm ctaText="Quiero mi demo" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-xl font-bold font-playfair">Precensusu AI</span>
          </div>
          <p className="text-muted-foreground mb-4">Automatizaciones con IA para cualquier negocio</p>
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Términos</a>
            <a href="#" className="hover:text-foreground">Privacidad</a>
            <a href="https://www.linkedin.com" className="hover:text-foreground" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://www.tiktok.com" className="hover:text-foreground" target="_blank" rel="noreferrer">TikTok</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
