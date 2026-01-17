import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, Phone, Languages, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'च्याट' },
  { path: '/documents', icon: FileText, label: 'कागजात' },
  { path: '/contacts', icon: Phone, label: 'सम्पर्क' },
  { path: '/translate', icon: Languages, label: 'अनुवाद' },
  { path: '/profile', icon: User, label: 'प्रोफाइल' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path === '/' && location.pathname.startsWith('/chat'));
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-item flex-1 py-3 ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};