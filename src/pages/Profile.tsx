import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('UAE');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setName(data.name || '');
      setCountry(data.country || 'UAE');
      setEmergencyContact(data.emergency_contact || '');
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    const { error } = await supabase.from('profiles').update({
      name, country, emergency_contact: emergencyContact
    }).eq('user_id', user.id);
    
    if (error) toast.error('बचत गर्न सकिएन');
    else toast.success('प्रोफाइल बचत भयो!');
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1 className="text-lg font-semibold">मेरो प्रोफाइल</h1>
      </header>

      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base">नाम</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="तपाईंको नाम" className="input-field mt-2" />
          </div>
          <div>
            <Label className="text-base">कार्यरत देश</Label>
            <select value={country} onChange={e => setCountry(e.target.value)} className="input-field mt-2 w-full">
              {['UAE', 'Qatar', 'Saudi Arabia', 'Malaysia', 'Kuwait'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-base">आपतकालीन सम्पर्क</Label>
            <Input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="फोन नम्बर" className="input-field mt-2" />
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button onClick={saveProfile} disabled={loading} className="w-full btn-primary">
            <Save className="w-5 h-5" /> बचत गर्नुहोस्
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="w-full btn-ghost text-destructive">
            <LogOut className="w-5 h-5" /> लग आउट
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}