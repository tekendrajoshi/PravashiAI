import { useState } from 'react';
import { Scale, MessageCircle, Mail, Upload, X, Phone, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface LegalAdvisor {
  name: string;
  speciality: string;
  whatsapp: string;
  email: string;
  info: string;
}

const legalAdvisors: LegalAdvisor[] = [
  {
    name: "LabourLawUAE Legal Consultants",
    speciality: "Employment & Labour Law in UAE",
    whatsapp: "+971501888453",
    email: "inquiry@labourlawuae.com",
    info: "ज्याला विवाद, करार समस्या, श्रम विवाद, भिसा समस्यामा अनुभवी टोली। दुबई र UAE मा सेवा।"
  },
  {
    name: "Al Menhali Advocates & Legal Consultancy",
    speciality: "Labour Law, Employment Disputes, Contract Defense",
    whatsapp: "+971504911142",
    email: "almenhali.lawyer@gmail.com",
    info: "रोजगार उल्लंघन, ज्याला दाबी, अन्यायपूर्ण बर्खास्ती, कार्यस्थल विवादमा कानुनी सहयोग। अबु धाबीमा।"
  },
  {
    name: "Al Kabban & Associates (Employee Rights Lawyers)",
    speciality: "Wage Claims, Unfair Termination, Labour Court",
    whatsapp: "+971505385138",
    email: "info@alkabban.com",
    info: "ज्याला दाबी, अन्यायपूर्ण बर्खास्ती, भेदभाव, श्रम अदालत प्रतिनिधित्व। UAE मा कर्मचारी अधिकार।"
  }
];

const safetyRules = [
  {
    title: "सधैं आफ्नो राहदानी आफैंसँग राख्नुहोस्",
    content: "नियोक्ता वा एजेन्सीले कानुनी रूपमा तपाईंको राहदानी राख्न सक्दैनन्। यदि कसैले तपाईंको सहमति बिना राख्छ भने, तुरुन्तै अधिकारीलाई सम्पर्क गर्नुहोस्।"
  },
  {
    title: "हस्ताक्षर गर्नुअघि आफ्नो करार बुझ्नुहोस्",
    content: "आफ्नो रोजगार करार ध्यानपूर्वक पढ्नुहोस्। तलब, भूमिका, काम गर्ने समय, सुविधा र बिदाका शर्तहरू वाचा गरिएकोसँग मिल्छ कि सुनिश्चित गर्नुहोस्। मौखिक वाचामा भर नपर्नुहोस्।"
  },
  {
    title: "वैध कार्य भिसा सुनिश्चित गर्नुहोस्",
    content: "सधैं सुनिश्चित गर्नुहोस् कि तपाईंसँग सही रोजगार भिसा छ (भिजिट भिसा होइन)। भिजिट भिसामा काम गर्नु गैरकानुनी हो र जरिवाना, हिरासत वा निष्कासन हुन सक्छ।"
  },
  {
    title: "सबै कागजातहरूको प्रतिलिपि राख्नुहोस्",
    content: "आफ्नो करार, प्रस्ताव पत्र, तलब स्लिप, भिसा/आईडी कागजातहरूको इलेक्ट्रोनिक र भौतिक प्रतिलिपि सुरक्षित राख्नुहोस्।"
  },
  {
    title: "पहिले आधिकारिक माध्यमबाट उजुरी गर्नुहोस्",
    content: "वकिललाई बढाउनुअघि MoHRE उजुरी वा दूतावास समर्थन जस्ता कानुनी प्रक्रियाहरू प्रयोग गर्नुहोस्। यसले लागत घटाउँछ र प्रायः समस्या छिटो समाधान गर्छ।"
  },
  {
    title: "अवैध भर्ती एजेन्टहरूबाट सावधान रहनुहोस्",
    content: "अत्यधिक शुल्क, अस्पष्ट कामको विवरण, वा अग्रिम नगद माग जस्ता चेतावनी संकेतहरूमा ध्यान दिनुहोस्।"
  },
  {
    title: "चाँडै कानुनी सहायता खोज्नुहोस्",
    content: "गम्भीर समस्या आउने बित्तिकै (ज्याला ढिलाइ, ज्याला कटौती, अन्यायपूर्ण बर्खास्ती, राहदानी होल्ड), प्रमाण सुरक्षित गर्न र वृद्धि रोक्न कानुनी सल्लाहकारसँग परामर्श गर्नुहोस्।"
  }
];

export function LegalAdvisorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    issue: '',
    contactMethod: 'whatsapp'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const openWhatsApp = (number: string) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const openEmail = (email: string) => {
    window.open(`mailto:${email}?subject=कानुनी सहायता अनुरोध&body=नमस्ते, मलाई कानुनी सहायता चाहिएको छ।`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast.error('कृपया PDF फाइल मात्र अपलोड गर्नुहोस्');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.issue) {
      toast.error('कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्');
      return;
    }
    toast.success('तपाईंको अनुरोध पठाइयो! हामी छिट्टै सम्पर्क गर्नेछौं।');
    setShowForm(false);
    setFormData({ name: '', phone: '', issue: '', contactMethod: 'whatsapp' });
    setSelectedFile(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary">
          <Scale className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Scale className="w-6 h-6" />
            कानुनी सल्लाहकार सहायता (UAE)
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Legal Advisors List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">🏛️ कानुनी सल्लाहकारहरू</h3>
            {legalAdvisors.map((advisor, index) => (
              <div key={index} className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-primary">{advisor.name}</h4>
                  <p className="text-xs text-muted-foreground">{advisor.speciality}</p>
                </div>
                <p className="text-sm text-foreground/80">{advisor.info}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    onClick={() => openWhatsApp(advisor.whatsapp)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp [{advisor.whatsapp}]
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => openEmail(advisor.email)}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Safety Rules */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b pb-2">📌 UAE मा नेपाली कामदारहरूको लागि सामान्य कानुनी सुरक्षा नियमहरू</h3>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 space-y-3">
              {safetyRules.map((rule, index) => (
                <div key={index} className="text-xs">
                  <p className="font-medium text-foreground">
                    {index + 1}. {rule.title}
                  </p>
                  <p className="text-muted-foreground ml-4 mt-0.5">
                    {rule.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Request Legal Help CTA */}
          {!showForm ? (
            <Button 
              className="w-full gap-2 h-12 text-base"
              onClick={() => setShowForm(true)}
            >
              <FileText className="w-5 h-5" />
              कानुनी सहायता अनुरोध गर्नुहोस्
            </Button>
          ) : (
            <div className="bg-muted/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">कानुनी सहायता फारम</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    नाम *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="तपाईंको पूरा नाम"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    फोन नम्बर *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+971..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    समस्याको विवरण *
                  </Label>
                  <Textarea
                    id="issue"
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    placeholder="तपाईंको समस्या यहाँ लेख्नुहोस्..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    PDF अपलोड (ऐच्छिक)
                  </Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      चयनित: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>सम्पर्क विधि *</Label>
                  <RadioGroup
                    value={formData.contactMethod}
                    onValueChange={(value) => setFormData({ ...formData, contactMethod: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="whatsapp" id="whatsapp" />
                      <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="cursor-pointer">Email</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full">
                  पठाउनुहोस्
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
