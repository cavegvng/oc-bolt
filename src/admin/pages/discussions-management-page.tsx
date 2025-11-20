import { useEffect, useState } from 'react';
import { Star, Megaphone, Pin, Search, Filter, Settings, ExternalLink } from 'lucide-react';
import { AdminLayout } from '../components/admin-layout';
import { StatusBadge } from '../components/status-badge';
import { BulkActionBar } from '../components/bulk-action-bar';
import { ModerationModal } from '../../components/ModerationModal';
import { getAllDiscussionsWithControls, bulkUpdateDiscussionControls } from '../../services/discussion-control-service';
import { useAuth } from '../../contexts/AuthContext';

type FilterType = 'all' | 'featured' | 'promoted' | 'pinned';

export function DiscussionsManagementPage() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);

  useEffect(() => {
    loadDiscussions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [discussions, searchQuery, filterType]);

  const loadDiscussions = async () => {
    try {
      const data = await getAllDiscussionsWithControls();
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...discussions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.users?.username.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((d) => {
        if (filterType === 'featured') return d.is_featured;
        if (filterType === 'promoted') return d.is_promoted;
        if (filterType === 'pinned') return d.is_pinned;
        return true;
      });
    }

    setFilteredDiscussions(filtered);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredDiscussions.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredDiscussions.map((d) => d.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkToggleFeatured = async (value: boolean) => {
    if (!user?.id) return;
    try {
      await bulkUpdateDiscussionControls(
        Array.from(selectedItems),
        { is_featured: value },
        user.id
      );
      setSelectedItems(new Set());
      await loadDiscussions();
    } catch (error) {
      console.error('Error updating discussions:', error);
      alert('Failed to update discussions');
    }
  };

  const handleBulkTogglePromoted = async (value: boolean) => {
    if (!user?.id) return;
    try {
      await bulkUpdateDiscussionControls(
        Array.from(selectedItems),
        { is_promoted: value },
        user.id
      );
      setSelectedItems(new Set());
      await loadDiscussions();
    } catch (error) {
      console.error('Error updating discussions:', error);
      alert('Failed to update discussions');
    }
  };

  const handleBulkTogglePinned = async (value: boolean) => {
    if (!user?.id) return;
    try {
      await bulkUpdateDiscussionControls(
        Array.from(selectedItems),
        { is_pinned: value },
        user.id
      );
      setSelectedItems(new Set());
      await loadDiscussions();
    } catch (error) {
      console.error('Error updating discussions:', error);
      alert('Failed to update discussions');
    }
  };

  const handleBulkStatusChange = async (status: 'approved' | 'pending' | 'quarantined' | 'removed') => {
    if (!user?.id) return;
    if (!confirm(`Are you sure you want to change the status of ${selectedItems.size} discussion(s) to "${status}"?`)) {
      return;
    }
    try {
      await bulkUpdateDiscussionControls(
        Array.from(selectedItems),
        { moderation_status: status },
        user.id
      );
      setSelectedItems(new Set());
      await loadDiscussions();
    } catch (error) {
      console.error('Error updating discussions:', error);
      alert('Failed to update discussion status');
    }
  };

  const handleOpenModal = (discussion: any) => {
    setSelectedDiscussion(discussion);
    setModerationModalOpen(true);
  };

  const handleCloseModal = () => {
    setModerationModalOpen(false);
    setSelectedDiscussion(null);
  };

  const handleModalUpdate = async () => {
    await loadDiscussions();
    handleCloseModal();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: discussions.length,
    featured: discussions.filter((d) => d.is_featured).length,
    promoted: discussions.filter((d) => d.is_promoted).length,
    pinned: discussions.filter((d) => d.is_pinned).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Discussion Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage featured, promoted, and pinned discussions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Discussions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-amber-600">{stats.featured}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Featured</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">{stats.promoted}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Promoted</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">{stats.pinned}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pinned</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search discussions or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'featured', 'promoted', 'pinned'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filterType === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredDiscussions.length} of {discussions.length} discussions
          </div>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            {selectedItems.size === filteredDiscussions.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.size === filteredDiscussions.length &&
                        filteredDiscussions.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Discussion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDiscussions.map((discussion) => (
                  <tr
                    key={discussion.id}
                    className={`transition-colors ${
                      selectedItems.has(discussion.id)
                        ? 'bg-blue-50 dark:bg-blue-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(discussion.id)}
                        onChange={() => handleSelectItem(discussion.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {discussion.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {discussion.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {discussion.users?.username || 'Unknown'}
                    </td>
                    <td className="px-4 py-4">
                      {discussion.categories && (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: discussion.categories.color }}
                        >
                          {discussion.categories.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {discussion.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                        {discussion.is_promoted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            <Megaphone className="w-3 h-3" />
                            Promoted
                          </span>
                        )}
                        {discussion.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                        {!discussion.is_featured &&
                          !discussion.is_promoted &&
                          !discussion.is_pinned && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              None
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {discussion.view_count || 0}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(discussion)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Manage controls"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <a
                          href={`/discussions/${discussion.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View discussion"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredDiscussions.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No discussions found matching your criteria
          </div>
        )}

        {selectedItems.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedItems.size} discussion{selectedItems.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkToggleFeatured(true)}
                    className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Feature
                  </button>
                  <button
                    onClick={() => handleBulkToggleFeatured(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Unfeature
                  </button>
                  <button
                    onClick={() => handleBulkTogglePromoted(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Megaphone className="w-4 h-4" />
                    Promote
                  </button>
                  <button
                    onClick={() => handleBulkTogglePromoted(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Unpromote
                  </button>
                  <button
                    onClick={() => handleBulkTogglePinned(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Pin className="w-4 h-4" />
                    Pin
                  </button>
                  <button
                    onClick={() => handleBulkTogglePinned(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Unpin
                  </button>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkStatusChange(e.target.value as any);
                        e.target.value = '';
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>Change Status...</option>
                    <option value="approved">✓ Approved</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="quarantined">⚠️ Quarantined</option>
                    <option value="removed">🚫 Removed</option>
                  </select>
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedDiscussion && (
        <ModerationModal
          discussion={selectedDiscussion}
          isOpen={moderationModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleModalUpdate}
        />
      )}
    </AdminLayout>
  );
}
