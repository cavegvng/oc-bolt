import { useState, useEffect } from 'react';
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
          fixed left-0 h-full bg-[#0f0f0f] border-r border-white/[0.08] z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 top-0 w-full' : '-translate-x-full top-0'}
          md:translate-x-0 md:top-0
          ${isExpanded ? 'md:w-64' : 'md:w-16'}
        `}
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.5)',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.08]">
            <Link
              to="/"
              onClick={onClose}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isExpanded ? 'opacity-100' : 'md:opacity-0 opacity-100'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6600] to-[#ff3300] flex items-center justify-center text-white font-bold text-sm">
                OC
              </div>
              {isExpanded && (
                <span className="text-gray-100 font-semibold text-sm whitespace-nowrap">
                  OverlyConcerned
                </span>
              )}
            </Link>

            <button
              onClick={onPinToggle}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/[0.05] transition-all"
              style={{
                boxShadow: isPinned ? 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 4px 20px rgba(0,0,0,0.5)' : 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <Pin className={`w-4 h-4 transition-transform ${isPinned ? 'rotate-45' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/[0.05] transition-all"
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
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${active ? 'bg-[#ff6600]/20 text-[#ff6600]' : 'text-gray-100 hover:bg-white/[0.05]'}
                    `}
                    style={{
                      boxShadow: active
                        ? 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 4px 20px rgba(0,0,0,0.5)'
                        : 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.5)',
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
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
                  <div className="h-px bg-white/[0.08]" />
                </div>
                <div className="space-y-1">
                  {isExpanded && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                          ${active ? 'bg-[#00ff99]/20 text-[#00ff99]' : 'text-gray-100 hover:bg-white/[0.05]'}
                        `}
                        style={{
                          boxShadow: active
                            ? 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 4px 20px rgba(0,0,0,0.5)'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.5)',
                        }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
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
