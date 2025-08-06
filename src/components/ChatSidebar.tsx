import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  User as UserIcon, 
  CreditCard, 
  LogOut, 
  Trash2,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  user: User;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onCreateChat: (title?: string) => Promise<string | null>;
}

export function ChatSidebar({ 
  user, 
  currentChatId, 
  onChatSelect, 
  onCreateChat 
}: ChatSidebarProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching chat sessions:", error);
        return;
      }

      setChatSessions(data || []);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const handleNewChat = async () => {
    const chatId = await onCreateChat("Nueva conversación");
    if (chatId) {
      await fetchChatSessions();
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", chatId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la conversación.",
        });
        return;
      }

      setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        onChatSelect("");
      }

      toast({
        title: "Conversación eliminada",
        description: "La conversación ha sido eliminada correctamente.",
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la conversación.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = () => {
    if (user.user_metadata?.username) {
      return user.user_metadata.username.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  return (
    <>
      <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg">Precensus AI</h1>
                <p className="text-sm text-muted-foreground">
                  Automatización Inteligente
                </p>
              </div>
            )}
          </div>
          <SidebarTrigger className="ml-auto" />
        </SidebarHeader>

        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              {!collapsed && "Conversaciones"}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-6 w-6 p-0"
                title="Nueva conversación"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {!collapsed && "No hay conversaciones"}
                  </div>
                ) : (
                  chatSessions.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        onClick={() => onChatSelect(chat.id)}
                        isActive={currentChatId === chat.id}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && (
                            <span className="truncate">{chat.title}</span>
                          )}
                        </div>
                        {!collapsed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto w-auto p-1 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatToDelete(chat.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.username || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Mi cuenta</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/#precios")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Precios</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la conversación y todos sus mensajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (chatToDelete) {
                  handleDeleteChat(chatToDelete);
                  setChatToDelete(null);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}