import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const leadSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto"),
  email: z.string().email("Email inválido"),
  details: z.string().max(1000).optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  variant?: "compact" | "full";
  ctaText?: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ variant = "full", ctaText = "Quiero mi demo" }) => {
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", details: "" },
  });

  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (values: LeadFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-lead", {
        body: { name: values.name, email: values.email, details: values.details },
      });
      if (error) throw error;

      toast({ title: "¡Gracias!", description: "Hemos recibido tu solicitud. Te contactaremos en breve." });
      form.reset();
    } catch (e: any) {
      console.error("Lead form error", e);
      toast({
        title: "No se pudo enviar",
        description: "Configura la API de email o envíanos un correo a precensus@gmail.com",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={variant === "compact" ? "grid gap-3 md:grid-cols-[1fr_1fr_auto]" : "grid gap-4"}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {variant === "full" && (
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Qué quieres automatizar? (opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Cuéntanos brevemente tu caso" rows={3} {...field} />
                </FormControl>
                <FormDescription>Ej.: Seguimiento de leads, generación de propuestas, atención al cliente…</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {variant === "compact" ? (
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Enviando…" : ctaText}
            </Button>
          </div>
        ) : (
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Enviando…" : ctaText}
          </Button>
        )}
      </form>
    </Form>
  );
};
