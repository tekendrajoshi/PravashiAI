import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Trash2, Edit2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentChatId?: string;
}

export const ChatSidebar = ({ isOpen, onClose, currentChatId }: ChatSidebarProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isOpen) {
      loadChats();
    }
  }, [user, isOpen]);

  const loadChats = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading chats:', error);
    } else {
      setChats(data || []);
    }
    setLoading(false);
  };

  const createNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title: 'नयाँ कुराकानी' })
      .select()
      .single();

    if (error) {
      toast.error('च्याट बनाउन सकिएन');
    } else if (data) {
      setChats([data, ...chats]);
      navigate(`/chat/${data.id}`);
      onClose();
    }
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    
    if (error) {
      toast.error('च्याट मेट्न सकिएन');
    } else {
      setChats(chats.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        navigate('/');
      }
      toast.success('च्याट मेटियो');
    }
  };

  const startEditing = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = async (chatId: string) => {
    const { error } = await supabase
      .from('chats')
      .update({ title: editTitle })
      .eq('id', chatId);

    if (error) {
      toast.error('शीर्षक बचत गर्न सकिएन');
    } else {
      setChats(chats.map(c => c.id === chatId ? { ...c, title: editTitle } : c));
    }
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ne-NP', { month: 'short', day: 'numeric' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg">तपाईंको कुराकानीहरू</SheetTitle>
        </SheetHeader>
        
        <div className="p-4">
          <Button 
            onClick={createNewChat} 
            className="w-full btn-primary text-base"
          >
            <Plus className="w-5 h-5" />
            नयाँ कुराकानी
          </Button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-180px)] px-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : chats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              कुनै कुराकानी छैन
            </p>
          ) : (
            <div className="space-y-1">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors
                    ${currentChatId === chat.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  {editingId === chat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <button onClick={() => saveTitle(chat.id)} className="text-success">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { navigate(`/chat/${chat.id}`); onClose(); }}
                        className="flex-1 flex items-start gap-3 text-left"
                      >
                        <MessageSquare className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(chat.updated_at)}</p>
                        </div>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={() => startEditing(chat)}
                          className="p-1 hover:text-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="p-1 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};