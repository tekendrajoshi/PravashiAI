import { useState, useRef } from 'react';
import { ArrowRightLeft, Volume2, Loader2, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const languages = [
  { code: 'ne', name: 'नेपाली', speechCode: 'ne-NP' },
  { code: 'en', name: 'English', speechCode: 'en-US' },
  { code: 'ar', name: 'العربية', speechCode: 'ar-SA' },
  { code: 'hi', name: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'my', name: 'Bahasa Melayu', speechCode: 'ms-MY' },
];

export default function Translate() {
  const [fromLang, setFromLang] = useState('ne');
  const [toLang, setToLang] = useState('en');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const translate = async (textToTranslate?: string) => {
    const text = textToTranslate || inputText;
    if (!text.trim()) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, fromLang, toLang }
      });
      
      if (error) throw error;
      setOutputText(data.translation);
      return data.translation;
    } catch {
      toast.error('अनुवाद गर्न सकिएन');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const speak = (text: string, langCode: string) => {
    if (!text.trim()) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const lang = languages.find(l => l.code === langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang?.speechCode || 'en-US';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('तपाईंको ब्राउजरमा भ्वाइस इनपुट उपलब्ध छैन');
      return;
    }

    const recognition = new SpeechRecognition();
    const lang = languages.find(l => l.code === fromLang);
    recognition.lang = lang?.speechCode || 'ne-NP';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast.error('भ्वाइस पहिचान गर्न सकिएन');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Voice-to-voice translation: speak → translate → speak output
  const handleVoiceTranslation = async () => {
    if (isRecording) {
      stopVoiceInput();
      // After stopping, translate and speak the result
      if (inputText.trim()) {
        const translation = await translate();
        if (translation) {
          speak(translation, toLang);
        }
      }
    } else {
      setOutputText('');
      startVoiceInput();
    }
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1 className="text-lg font-semibold">अनुवाद</h1>
        <p className="text-xs text-muted-foreground">भ्वाइस अनुवाद सहित</p>
      </header>

      <div className="p-4 space-y-4">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <select value={fromLang} onChange={e => setFromLang(e.target.value)} className="flex-1 input-field">
            {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <Button variant="ghost" size="icon" onClick={swapLanguages} className="flex-shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </Button>
          <select value={toLang} onChange={e => setToLang(e.target.value)} className="flex-1 input-field">
            {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>

        {/* Voice Translation Button */}
        <div className="card-elevated bg-accent/20 p-6 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            बटन थिच्नुहोस्, बोल्नुहोस्, अनुवाद सुन्नुहोस्
          </p>
          <Button
            onClick={handleVoiceTranslation}
            size="lg"
            className={`w-20 h-20 rounded-full ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {isRecording ? 'बोल्दै... थाम्न थिच्नुहोस्' : 'बोल्न थिच्नुहोस्'}
          </p>
        </div>

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-3 text-xs text-muted-foreground">वा टाइप गर्नुहोस्</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        {/* Input */}
        <div className="card-elevated">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">{languages.find(l => l.code === fromLang)?.name}</span>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={startVoiceInput}
                disabled={isRecording}
              >
                <Mic className="w-4 h-4" />
              </Button>
              {inputText && (
                <Button variant="ghost" size="sm" onClick={() => speak(inputText, fromLang)}>
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <Textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="अनुवाद गर्न पाठ लेख्नुहोस्..."
            className="min-h-[100px] border-0 p-0 focus-visible:ring-0 text-lg"
          />
        </div>

        <Button onClick={() => translate()} disabled={!inputText.trim() || loading} className="w-full btn-primary">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'अनुवाद गर्नुहोस्'}
        </Button>

        {/* Output */}
        {outputText && (
          <div className="card-elevated bg-primary/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">{languages.find(l => l.code === toLang)?.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => speak(outputText, toLang)}
                disabled={isSpeaking}
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
            <p className="text-lg">{outputText}</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
