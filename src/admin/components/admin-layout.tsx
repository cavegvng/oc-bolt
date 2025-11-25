import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flag,
  Users,
  FileText,
  Shield,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/use-permissions';
import { getRoleDisplayName, getRoleColor } from '../../utils/permissions';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  minRole?: 'moderator' | 'super_moderator' | 'admin';
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { hasRole, canViewAuditLogs } = usePermissions();

  const navItems: NavItem[] = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: '/admin/discussions',
      label: 'Discussions',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      path: '/admin/moderation',
      label: 'Moderation Queue',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      path: '/admin/reports',
      label: 'Reports',
      icon: <Flag className="w-5 h-5" />,
    },
    {
      path: '/admin/homepage-controls',
      label: 'Homepage Controls',
      icon: <LayoutDashboard className="w-5 h-5" />,
      minRole: 'admin',
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: <Users className="w-5 h-5" />,
      minRole: 'moderator',
    },
    {
      path: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: <FileText className="w-5 h-5" />,
      minRole: 'super_moderator',
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.minRole) return true;
    return hasRole(item.minRole);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {filteredNavItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Signed in as</div>
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {user?.email}
                </div>
                <div className={`text-sm font-semibold mt-1 ${getRoleColor(userRole)}`}>
                  {getRoleDisplayName(userRole)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <div className="w-6" />
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
