import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export const ChatMessage = ({ role, content, isLoading }: ChatMessageProps) => {
  const isUser = role === 'user';

  // Format assistant messages with proper structure
  const formatContent = (text: string) => {
    if (isUser) return text;
    
    // Split by numbered sections
    const sections = text.split(/(\d+\))/g);
    
    return sections.map((section, i) => {
      if (/^\d+\)$/.test(section)) {
        return null; // Will be combined with next section
      }
      
      const prevSection = sections[i - 1];
      if (prevSection && /^\d+\)$/.test(prevSection)) {
        const sectionNum = prevSection;
        return (
          <div key={i} className="mb-3">
            <span className="font-bold text-primary">{sectionNum}</span>
            <span className="whitespace-pre-wrap">{section}</span>
          </div>
        );
      }
      
      if (section.trim()) {
        return <span key={i} className="whitespace-pre-wrap">{section}</span>;
      }
      return null;
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
        {isLoading ? (
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-current rounded-full animate-typing" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : (
          <div className="text-base leading-relaxed">
            {formatContent(content)}
          </div>
        )}
      </div>
    </div>
  );
};