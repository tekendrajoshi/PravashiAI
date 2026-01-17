import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { QuestionTemplates } from '@/components/QuestionTemplates';
import { LegalAdvisorPanel } from '@/components/LegalAdvisorPanel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (chatId) {
      setCurrentChatId(chatId);
      loadMessages(chatId);
    } else {
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [chatId, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (id: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages((data || []).map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
    }
  };

  const createNewChat = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title: 'नयाँ कुराकानी' })
      .select()
      .single();

    if (error) {
      toast.error('च्याट बनाउन सकिएन');
      return null;
    }

    return data.id;
  };

  const sendMessage = async (content: string) => {
    if (!user) return;

    let activeChatId = currentChatId;

    // Create new chat if needed
    if (!activeChatId) {
      activeChatId = await createNewChat();
      if (!activeChatId) return;
      setCurrentChatId(activeChatId);
      navigate(`/chat/${activeChatId}`, { replace: true });
    }

    // Add user message to UI immediately
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rag-chat', {
        body: {
          message: content,
          chatHistory: messages.slice(-10), // Last 10 messages for context
          chatId: activeChatId,
          userId: user.id,
        },
      });

      if (error) throw error;

      // Reload messages from database
      await loadMessages(activeChatId);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'माफ गर्नुहोला, केही समस्या भयो। कृपया पुन: प्रयास गर्नुहोस्।',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
      
      toast.error('सन्देश पठाउन सकिएन');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    toast.info('PDF डाउनलोड सुविधा छिट्टै आउँदैछ');
  };

  return (
    <div className="page-container flex flex-col h-screen">
      {/* Header */}
      <header className="app-header">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-lg font-semibold">कानुनी सहायक</h1>
          <p className="text-xs text-muted-foreground">तपाईंको प्रश्नको जवाफ पाउनुहोस्</p>
        </div>
        
        <div className="flex items-center gap-1">
          <LegalAdvisorPanel />
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={downloadPDF}>
              <Download className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚖️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">नमस्ते! 🙏</h2>
              <p className="text-muted-foreground">
                तपाईंको कानुनी प्रश्न सोध्नुहोस्
              </p>
            </div>
            <QuestionTemplates onSelect={sendMessage} />
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))}
            {loading && (
              <ChatMessage role="assistant" content="" isLoading />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={loading} />

      {/* Bottom Nav */}
      <BottomNav />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentChatId={currentChatId || undefined}
      />
    </div>
  );
}