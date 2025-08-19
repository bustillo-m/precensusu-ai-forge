import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BusinessChatSidebar } from "@/components/BusinessChatSidebar";
import { BusinessChatArea } from "@/components/BusinessChatArea";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  username: string;
}

export default function BusinessChat() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        navigate("/auth");
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('auth_token');
          navigate("/auth");
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        navigate("/auth");
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleCreateChat = async (title: string = "Nueva consulta empresarial") => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate("/auth");
        return null;
      }

      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear la conversación.",
        });
        return null;
      }

      const data = await response.json();
      setCurrentChatId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la conversación.",
      });
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BusinessChatSidebar 
          user={user}
          currentChatId={currentChatId}
          onChatSelect={setCurrentChatId}
          onCreateChat={handleCreateChat}
        />
        <main className="flex-1">
          <BusinessChatArea 
            user={user}
            currentChatId={currentChatId}
            onCreateChat={handleCreateChat}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}