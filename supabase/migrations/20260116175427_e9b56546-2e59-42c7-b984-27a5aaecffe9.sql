-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'UAE',
  preferred_language TEXT DEFAULT 'ne',
  emergency_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chats table for conversation sessions
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'नयाँ कुराकानी',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for scanned/uploaded documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  original_filename TEXT,
  storage_path TEXT,
  ocr_text TEXT,
  doc_type TEXT,
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  red_flags JSONB DEFAULT '[]'::jsonb,
  analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table for embassy/NGO contacts
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ne TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Chats policies
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies (via chat ownership)
CREATE POLICY "Users can view messages of their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages to their chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Contacts are public (read-only for all authenticated users)
CREATE POLICY "Contacts are viewable by all authenticated users" ON public.contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default contacts
INSERT INTO public.contacts (country, type, name, name_ne, phone, email, address) VALUES
('UAE', 'embassy', 'Embassy of Nepal in UAE', 'संयुक्त अरब इमिरेट्समा नेपाली दूतावास', '+971-4-2222155', 'eonuae@mofa.gov.np', 'Dubai, UAE'),
('UAE', 'labor', 'UAE Ministry of Human Resources', 'UAE मानव संसाधन मन्त्रालय', '80060', NULL, 'Dubai, UAE'),
('UAE', 'ngo', 'Migrant-Rights.org', 'माइग्रेन्ट राइट्स', NULL, 'info@migrant-rights.org', 'Dubai, UAE'),
('Qatar', 'embassy', 'Embassy of Nepal in Qatar', 'कतारमा नेपाली दूतावास', '+974-44672560', 'eonqatar@mofa.gov.np', 'Doha, Qatar'),
('Qatar', 'labor', 'Qatar Labour Office', 'कतार श्रम कार्यालय', '+974-44111999', NULL, 'Doha, Qatar'),
('Saudi Arabia', 'embassy', 'Embassy of Nepal in Saudi Arabia', 'साउदी अरबमा नेपाली दूतावास', '+966-11-4632800', 'eonsaudi@mofa.gov.np', 'Riyadh, Saudi Arabia'),
('Saudi Arabia', 'labor', 'Saudi Ministry of Human Resources', 'साउदी मानव संसाधन मन्त्रालय', '19911', NULL, 'Riyadh, Saudi Arabia'),
('Malaysia', 'embassy', 'Embassy of Nepal in Malaysia', 'मलेसियामा नेपाली दूतावास', '+60-3-20203333', 'eonmalaysia@mofa.gov.np', 'Kuala Lumpur, Malaysia'),
('Malaysia', 'ngo', 'Tenaganita', 'टेनागानिटा', '+60-3-78770608', 'tenaganita@tenaganita.net', 'Kuala Lumpur, Malaysia'),
('Kuwait', 'embassy', 'Embassy of Nepal in Kuwait', 'कुवेतमा नेपाली दूतावास', '+965-22563920', 'eonkuwait@mofa.gov.np', 'Kuwait City, Kuwait');