import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Scale, TrendingUp, Users, BarChart3, Flag, Settings, Pin, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
  onPinToggle: () => void;
  onHoverChange: (isHovered: boolean) => void;
}

export function Sidebar({ isOpen, onClose, isPinned, onPinToggle, onHoverChange }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isExpanded = isPinned || isHovered;

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Debates', href: '/debates', icon: Scale },
    { name: 'Hot Topics', href: '/hot-topics', icon: TrendingUp },
  ];

  const adminNavigation = user ? [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Moderation', href: '/admin/moderation', icon: Flag },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/homepage-controls', icon: Settings },
  ] : [];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 h-full bg-background border-r border-border z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 top-0 w-full' : '-translate-x-full top-0'}
          md:translate-x-0 md:top-0
          ${isExpanded ? 'md:w-64' : 'md:w-16'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 transition-all duration-300"
            >
              <div className="w-8 h-8 flex items-center justify-center text-red-600 font-bold text-lg flex-shrink-0">
                OC
              </div>
              {isExpanded && (
                <span className="text-foreground font-semibold text-sm whitespace-nowrap transition-opacity duration-300">
                  OverlyConcerned
                </span>
              )}
            </Link>

            <button
              onClick={onPinToggle}
              className={`
                hidden md:flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-all
                ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
              `}
            >
              <Pin className={`w-4 h-4 transition-transform ${isPinned ? 'rotate-45 fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="md:hidden flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 transition-all
                      ${active ? 'text-red-600 dark:text-red-500' : 'text-foreground hover:bg-accent/10'}
                    `}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    {isExpanded && (
                      <span className="font-medium text-sm whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {adminNavigation.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <div className="h-px bg-border" />
                </div>
                <div className="space-y-1">
                  {isExpanded && (
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Admin
                    </div>
                  )}
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 transition-all
                          ${active ? 'text-red-600 dark:text-red-500' : 'text-foreground hover:bg-accent/10'}
                        `}
                      >
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        {isExpanded && (
                          <span className="font-medium text-sm whitespace-nowrap">
                            {item.name}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
