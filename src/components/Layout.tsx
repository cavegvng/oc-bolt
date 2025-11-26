import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Home, MessageSquare, TrendingUp, PlusCircle, Sun, Moon, Scale, ChevronDown, Plus, Menu } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { NotificationBell } from './NotificationBell';
import { HotNowTicker } from './HotNowTicker';
import { ActivityTicker } from './ActivityTicker';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const stored = localStorage.getItem('sidebar-pinned');
    return stored === 'true';
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Debates', href: '/debates', icon: Scale },
    { name: 'Hot Topics', href: '/hot-topics', icon: TrendingUp },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handlePinToggle = () => {
    const newPinned = !sidebarPinned;
    setSidebarPinned(newPinned);
    localStorage.setItem('sidebar-pinned', String(newPinned));
  };

  const isSidebarExpanded = sidebarPinned || sidebarHovered;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isPinned={sidebarPinned}
        onPinToggle={handlePinToggle}
        onHoverChange={setSidebarHovered}
      />

      <div className="sticky top-0 z-50 w-full">
        <HotNowTicker />
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'md:ml-64' : 'md:ml-16'
        }`}
      >
        <div className="sticky top-8 z-40">
          <nav className="bg-card shadow-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="text-2xl font-bold text-foreground tracking-tight">
                    Overly<span className="text-red-600 group-hover:text-red-700 transition-colors">Concerned</span>
                  </div>
                  <span className="text-xs text-muted-foreground italic hidden lg:block">
                    Where passion meets perspective
                  </span>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors ${
                          isActive(item.href)
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center p-2 text-foreground hover:bg-accent rounded-2xl transition-colors"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </button>
                  <NotificationBell />
                  {user ? (
                    <>
                      <Link
                        to="/discussions/new"
                        className="flex items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors"
                        title="New Discussion"
                      >
                        <Plus className="w-5 h-5" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setUserMenuOpen(!userMenuOpen)}
                          className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-accent rounded-2xl transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-sm">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                          <ChevronDown className="w-4 h-4 hidden sm:block" />
                        </button>
                        {userMenuOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-card rounded-3xl shadow-lg border border-border py-2 z-50">
                            <Link
                              to="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent transition-colors"
                            >
                              <User className="w-4 h-4" />
                              <span>Profile</span>
                            </Link>
                            <button
                              onClick={() => {
                                signOut();
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden flex items-center justify-center p-2 text-foreground hover:bg-accent rounded-2xl transition-colors"
                        aria-label="Open menu"
                      >
                        <Menu className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-2xl transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden flex items-center justify-center p-2 text-foreground hover:bg-accent rounded-2xl transition-colors"
                        aria-label="Open menu"
                      >
                        <Menu className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors whitespace-nowrap ${
                        isActive(item.href)
                          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>

        <footer id="footer" className="bg-card border-t border-border pt-12 mt-24">
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                <span className="font-bold">Overly<span className="text-red-600">Concerned</span></span> &mdash; A space for the passionately opinionated
              </p>
              <p className="text-sm text-muted-foreground">
                Debate. Discuss. Overthink. Because everyone's an expert online.
              </p>
            </div>
          </div>
        </footer>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <ActivityTicker />
      </div>
    </div>
  );
}
