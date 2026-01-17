import { useState, useRef } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, isLoading, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check if speech recognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('तपाईंको ब्राउजरमा स्पीच रिकग्निसन उपलब्ध छैन');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ne-NP'; // Nepali
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="bg-card border-t border-border p-4 safe-bottom">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleRecording}
          className={`flex-shrink-0 h-12 w-12 rounded-xl ${isRecording ? 'bg-destructive text-destructive-foreground pulse-recording' : ''}`}
          disabled={disabled}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="आफ्नो प्रश्न यहाँ लेख्नुहोस्..."
          className="flex-1 min-h-[48px] max-h-32 resize-none rounded-xl text-base py-3"
          disabled={disabled || isLoading}
          rows={1}
        />
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary text-primary-foreground"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};