import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Building2, Users, Landmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';

interface Contact {
  id: string;
  country: string;
  type: string;
  name: string;
  name_ne: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const countries = ['UAE', 'Qatar', 'Saudi Arabia', 'Malaysia', 'Kuwait'];

export default function Contacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('UAE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadContacts();
  }, [user, selectedCountry]);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('country', selectedCountry);
    setContacts(data || []);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'embassy': return <Landmark className="w-5 h-5" />;
      case 'labor': return <Building2 className="w-5 h-5" />;
      case 'ngo': return <Users className="w-5 h-5" />;
      default: return <Building2 className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = { embassy: 'दूतावास', labor: 'श्रम कार्यालय', ngo: 'NGO' };
    return names[type] || type;
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1 className="text-lg font-semibold">आपतकालीन सम्पर्क</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Country Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {countries.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCountry === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : (
          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className="card-elevated">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    {getTypeIcon(contact.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{contact.name_ne || contact.name}</p>
                    <p className="text-sm text-muted-foreground">{getTypeName(contact.type)}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="btn-primary text-sm py-3 text-center">
                      <Phone className="w-4 h-4 inline mr-2" /> कल गर्नुहोस् ({contact.phone})
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="btn-ghost text-sm py-3 text-center">
                      <Mail className="w-4 h-4 inline mr-2" /> इमेल ({contact.email})
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}