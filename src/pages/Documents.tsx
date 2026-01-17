import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertTriangle, CheckCircle, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

interface AnalysisResult {
  doc_type: string;
  summary: string;
  clarity_score: number;
  red_flags: string[];
  questions_to_ask: string[];
}

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'ocr' | 'analysis' | 'result'>('upload');

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Convert PDF to images and extract text
  const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamic import to avoid build issues
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= Math.min(numPages, 5); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      // Create canvas to render PDF page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      // Convert canvas to blob for OCR
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      // OCR on the rendered page
      const result = await Tesseract.recognize(blob, 'eng+nep', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pageProgress = ((pageNum - 1) / numPages) * 100;
            const currentProgress = (m.progress / numPages) * 100;
            setOcrProgress(Math.round(pageProgress + currentProgress));
          }
        },
      });

      fullText += result.data.text + '\n\n';
    }

    return fullText.trim();
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('कृपया फोटो वा PDF फाइल छान्नुहोस्');
      return;
    }

    setSelectedFile(file);
    setStep('ocr');
    setIsProcessing(true);
    setOcrProgress(0);

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        // Handle PDF files
        extractedText = await extractTextFromPdf(file);
      } else {
        // Handle image files
        const result = await Tesseract.recognize(file, 'eng+nep', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });
        extractedText = result.data.text;
      }

      if (!extractedText.trim()) {
        throw new Error('कागजातबाट पाठ निकाल्न सकिएन');
      }

      setOcrText(extractedText);
      setStep('analysis');

      // Analyze document
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { ocrText: extractedText },
      });

      if (error) throw error;

      setAnalysis(data);
      setStep('result');

      // Save to database
      await supabase.from('documents').insert({
        user_id: user.id,
        original_filename: file.name,
        ocr_text: extractedText,
        doc_type: data.doc_type,
        clarity_score: data.clarity_score,
        red_flags: data.red_flags,
        analysis: data.summary,
      });

      toast.success('कागजात विश्लेषण सम्पन्न!');
    } catch (error) {
      console.error('Document processing error:', error);
      toast.error(error instanceof Error ? error.message : 'कागजात प्रक्रिया गर्न सकिएन');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-success';
    if (score >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  const getDocTypeName = (type: string) => {
    const types: Record<string, string> = {
      contract: 'करार',
      visa: 'भिसा',
      offer_letter: 'अफर लेटर',
      id: 'परिचय पत्र',
      other: 'अन्य',
    };
    return types[type] || type;
  };

  const askAboutDocument = () => {
    // Navigate to chat with document context
    navigate('/', { state: { documentContext: ocrText, analysis } });
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setOcrText('');
    setAnalysis(null);
    setStep('upload');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="app-header">
        <div className="flex-1">
          <h1 className="text-lg font-semibold">कागजात विश्लेषण</h1>
          <p className="text-xs text-muted-foreground">करार, भिसा, अफर लेटर जाँच गर्नुहोस्</p>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {step === 'upload' && (
          <>
            {/* Upload Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="card-interactive flex flex-col items-center gap-3 py-8"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <span className="font-medium">फाइल अपलोड</span>
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="card-interactive flex flex-col items-center gap-3 py-8"
              >
                <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center">
                  <Camera className="w-7 h-7 text-secondary" />
                </div>
                <span className="font-medium">फोटो खिच्नुहोस्</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {/* Instructions */}
            <div className="card-elevated space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                कसरी प्रयोग गर्ने
              </h3>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-medium text-sm">१</span>
                  <span>आफ्नो कागजातको फोटो खिच्नुहोस् वा फाइल अपलोड गर्नुहोस्</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-medium text-sm">२</span>
                  <span>AI ले कागजात पढ्नेछ र विश्लेषण गर्नेछ</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-medium text-sm">३</span>
                  <span>रातो झण्डाहरू र सोध्नु पर्ने प्रश्नहरू हेर्नुहोस्</span>
                </li>
              </ol>
            </div>
          </>
        )}

        {(step === 'ocr' || step === 'analysis') && (
          <div className="card-elevated flex flex-col items-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {step === 'ocr' ? 'पाठ निकाल्दै...' : 'विश्लेषण गर्दै...'}
            </h3>
            {step === 'ocr' && (
              <div className="w-full max-w-xs mt-4">
                <Progress value={ocrProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground mt-2">{ocrProgress}%</p>
              </div>
            )}
          </div>
        )}

        {step === 'result' && analysis && (
          <>
            {/* Document Type & Score */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">कागजातको प्रकार</p>
                  <p className="font-semibold text-lg">{getDocTypeName(analysis.doc_type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">स्पष्टता स्कोर</p>
                  <p className="font-bold text-2xl">{analysis.clarity_score}/100</p>
                </div>
              </div>
              <div className="clarity-meter">
                <div 
                  className={`clarity-meter-fill ${getScoreColor(analysis.clarity_score)}`}
                  style={{ width: `${analysis.clarity_score}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="card-elevated">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                सारांश
              </h3>
              <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Red Flags */}
            {analysis.red_flags.length > 0 && (
              <div className="card-elevated border-destructive/20 bg-destructive/5">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  रातो झण्डाहरू ({analysis.red_flags.length})
                </h3>
                <ul className="space-y-2">
                  {analysis.red_flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="badge-danger mt-0.5">⚠️</span>
                      <span className="text-foreground">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions to Ask */}
            {analysis.questions_to_ask.length > 0 && (
              <div className="card-elevated">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  परामर्शदातालाई सोध्नुहोस्
                </h3>
                <ul className="space-y-2">
                  {analysis.questions_to_ask.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="badge-info">❓</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={askAboutDocument} className="w-full btn-primary">
                यस कागजातबारे प्रश्न सोध्नुहोस्
              </Button>
              <Button onClick={resetUpload} variant="outline" className="w-full btn-ghost">
                अर्को कागजात स्क्यान गर्नुहोस्
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}