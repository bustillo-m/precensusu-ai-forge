import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Code, Upload, Shield, Mail, Calendar, Database, FileText } from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { AutomationForm } from "@/components/AutomationForm";

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
    <div className="min-h-screen bg-background font-inter">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold font-playfair">Precensusu AI</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#beneficios" className="text-muted-foreground hover:text-foreground">Beneficios</a>
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground">Cómo funciona</a>
            <a href="#casos" className="text-muted-foreground hover:text-foreground">Casos de uso</a>
            <a href="#precios" className="text-muted-foreground hover:text-foreground">Planes</a>
          </nav>
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/business-chat'} className="gap-2">
              Consultor IA
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' })} className="gap-2">
              Solicitar demo
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Automatiza tus procesos en minutos con agentes de IA, sin necesidad de programar
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Creamos flujos inteligentes listos para usar en n8n, combinando los mejores modelos de IA para ahorrar tiempo y reducir errores.
              </p>
              <div className="mb-6">
                <LeadForm variant="compact" ctaText="Quiero mi demo" />
              </div>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Sin código</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> JSON listo para n8n</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Optimizado por IA</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Soporte incluido</li>
              </ul>
            </div>

            <div id="hero-form" className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Solicita tu demo gratuita</h2>
              <p className="text-sm text-muted-foreground mb-4">Déjanos tus datos y te contactamos en menos de 24h.</p>
              <LeadForm ctaText="Solicitar automatización" />
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Beneficios clave</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Automatizaciones en minutos</CardTitle>
                  <CardDescription>Acelera la entrega con flujos listos para usar.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-primary" /> Sin necesidad de programar</CardTitle>
                  <CardDescription>Configura y usa sin escribir código.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Compatible con n8n</CardTitle>
                  <CardDescription>Exportamos JSON válido y optimizado.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Soporte y mantenimiento</CardTitle>
                  <CardDescription>Te acompañamos en la puesta en marcha.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Cómo funciona</h2>
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/d243776c-df5d-4936-a5c1-619630332a84.png" 
                alt="Proceso de automatización: 1. Pides la automatización, 2. La IA la diseña, 3. La optimizamos, 4. Importamos la automatización"
                className="max-w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Casos de uso */}
        <section id="casos" className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Casos de uso</h2>
            <div className="bg-background rounded-lg p-6 md:p-8 border">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-primary">E-commerce</h3>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-3"><Clock className="h-5 w-5 text-primary mt-0.5" /> Seguimiento de pedidos y notificaciones</li>
                    <li className="flex items-start gap-3"><Database className="h-5 w-5 text-primary mt-0.5" /> Gestión de devoluciones e inventario</li>
                    <li className="flex items-start gap-3"><Mail className="h-5 w-5 text-primary mt-0.5" /> Recuperación de carritos abandonados</li>
                  </ul>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-primary">Servicios profesionales</h3>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-3"><Calendar className="h-5 w-5 text-primary mt-0.5" /> Programación inteligente de citas</li>
                    <li className="flex items-start gap-3"><FileText className="h-5 w-5 text-primary mt-0.5" /> Generación de propuestas y contratos</li>
                    <li className="flex items-start gap-3"><Shield className="h-5 w-5 text-primary mt-0.5" /> Seguimiento de facturas y cobros</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logos de tecnologías */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
              <img src="/images/logos/openai.png" alt="Logo OpenAI" className="h-8" loading="lazy" />
              <img src="/images/logos/n8n.png" alt="Logo n8n" className="h-8" loading="lazy" />
            </div>
          </div>
        </section>

        {/* Testimonios */}
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
