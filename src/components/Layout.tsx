import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, BookOpen, Calendar, BarChart3, Settings, FileText, PenLine, LogOut, User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { SOSModal } from './SOSModal';

const navItems = [
  { path: '/today', label: 'Manhã', icon: Sun },
  { path: '/night', label: 'Noite', icon: Moon },
  { path: '/calendar', label: 'Calendário', icon: Calendar },
  { path: '/weekly', label: 'Semanal', icon: FileText },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/journal', label: 'Diário', icon: PenLine },
  { path: '/library', label: 'Biblioteca', icon: BookOpen },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { isFocusMode } = useFocusMode();
  const [showSOSModal, setShowSOSModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    const email = user?.email || '';
    const name = user?.user_metadata?.display_name || email;
    return name.slice(0, 2).toUpperCase();
  };

  // In focus mode, render minimal layout
  if (isFocusMode) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <main className="container mx-auto px-4 py-6 animate-fade-in">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* SOS Modal - Global */}
      <SOSModal open={showSOSModal} onOpenChange={setShowSOSModal} />
      
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Blueprint Digital</h1>
          <div className="flex items-center gap-2">
            {/* SOS Button - always visible */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSOSModal(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">SOS</span>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card/50 overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
