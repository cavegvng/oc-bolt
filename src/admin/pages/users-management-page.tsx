import { useEffect, useState } from 'react';
import { Users, Search, Edit, Shield, Calendar, MessageSquare, FileText } from 'lucide-react';
import { AdminLayout } from '../components/admin-layout';
import { StatusBadge } from '../components/status-badge';
import { getAllUsers, updateUserRole, type UserWithStats, type UserFilters } from '../../services/user-service';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/use-permissions';
import type { UserRole } from '../../types/moderation';

export function UsersManagementPage() {
  const { user } = useAuth();
  const { userRole, canActOnRole } = usePermissions();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({ role: 'all', search: '' });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      const { data, count } = await getAllUsers(filters, itemsPerPage, offset);
      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !user?.id || !roleChangeReason.trim()) {
      alert('Please provide a reason for this role change');
      return;
    }

    setUpdating(true);
    try {
      await updateUserRole(selectedUser.id, newRole, user.id, roleChangeReason);
      setRoleModalOpen(false);
      setSelectedUser(null);
      setRoleChangeReason('');
      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const openRoleModal = (user: UserWithStats) => {
    setSelectedUser(user);
    setNewRole(user.role as UserRole);
    setRoleModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'super_moderator':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'moderator':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user roles and view user statistics
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={filters.search || ''}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.role || 'all'}
              onChange={(e) => {
                setFilters({ ...filters, role: e.target.value as UserRole | 'all' });
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="super_moderator">Super Moderator</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userData.avatar_url ? (
                          <img
                            src={userData.avatar_url}
                            alt={userData.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {userData.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {userData.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {userData.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(userData.role)}`}>
                        {getRoleLabel(userData.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(userData.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          {userData.discussion_count} discussions
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {userData.comment_count} comments
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openRoleModal(userData)}
                        disabled={!canActOnRole(userData.role as UserRole) || userData.id === user?.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change User Role</h2>
              </div>
              <button
                onClick={() => {
                  setRoleModalOpen(false);
                  setSelectedUser(null);
                  setRoleChangeReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">User</p>
                <div className="flex items-center gap-3">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.username}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Current role: {getRoleLabel(selectedUser.role)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  {canActOnRole('moderator') && <option value="moderator">Moderator</option>}
                  {canActOnRole('super_moderator') && <option value="super_moderator">Super Moderator</option>}
                  {canActOnRole('admin') && <option value="admin">Admin</option>}
                  {canActOnRole('owner') && <option value="owner">Owner</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  placeholder="Explain why you're changing this user's role..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setRoleModalOpen(false);
                  setSelectedUser(null);
                  setRoleChangeReason('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={updating || !roleChangeReason.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
