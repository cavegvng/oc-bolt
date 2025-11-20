import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { AdminLayout } from '../components/admin-layout';
import { StatusBadge } from '../components/status-badge';
import { BulkActionBar } from '../components/bulk-action-bar';
import { getAllQuarantinedContent } from '../../services/moderation-service';
import { bulkApproveContent, bulkRemoveContent } from '../../services/moderation-service';
import { useAuth } from '../../contexts/AuthContext';
import type { ContentType } from '../../types/moderation';

export function ModerationQueuePage() {
  const { user } = useAuth();
  const [quarantinedContent, setQuarantinedContent] = useState<any>({ discussions: [], comments: [], debates: [] });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | ContentType>('all');

  useEffect(() => {
    loadQuarantinedContent();
  }, []);

  const loadQuarantinedContent = async () => {
    try {
      const data = await getAllQuarantinedContent();
      setQuarantinedContent(data);
    } catch (error) {
      console.error('Error loading quarantined content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    if (activeTab === 'all' || activeTab === 'discussion') {
      quarantinedContent.discussions.forEach((item: any) => allIds.add(`discussion-${item.id}`));
    }
    if (activeTab === 'all' || activeTab === 'comment') {
      quarantinedContent.comments.forEach((item: any) => allIds.add(`comment-${item.id}`));
    }
    if (activeTab === 'all' || activeTab === 'debate') {
      quarantinedContent.debates.forEach((item: any) => allIds.add(`debate-${item.id}`));
    }
    setSelectedItems(allIds);
  };

  const handleSelectItem = (type: ContentType, id: string) => {
    const key = `${type}-${id}`;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkApprove = async () => {
    if (!user?.id) return;

    const groups = groupSelectedByType();
    try {
      await Promise.all(
        Object.entries(groups).map(([type, ids]) =>
          bulkApproveContent(type as ContentType, ids, user.id)
        )
      );
      setSelectedItems(new Set());
      await loadQuarantinedContent();
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    }
  };

  const handleBulkRemove = async () => {
    if (!user?.id) return;

    const reason = prompt('Please provide a reason for removing this content:');
    if (!reason) return;

    const groups = groupSelectedByType();
    try {
      await Promise.all(
        Object.entries(groups).map(([type, ids]) =>
          bulkRemoveContent(type as ContentType, ids, user.id, reason)
        )
      );
      setSelectedItems(new Set());
      await loadQuarantinedContent();
    } catch (error) {
      console.error('Error removing content:', error);
      alert('Failed to remove content');
    }
  };

  const groupSelectedByType = () => {
    const groups: Record<string, string[]> = {};
    selectedItems.forEach(key => {
      const [type, id] = key.split('-');
      if (!groups[type]) groups[type] = [];
      groups[type].push(id);
    });
    return groups;
  };

  const renderContentItem = (item: any, type: ContentType) => {
    const key = `${type}-${item.id}`;
    const isSelected = selectedItems.has(key);
    const author = type === 'comment' ? item.user : item.author;

    return (
      <div
        key={key}
        className={`p-4 border rounded-lg transition-colors ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSelectItem(type, item.id)}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {type}
              </span>
              <StatusBadge status={item.moderation_status} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.report_count} reports
              </span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
              {type === 'comment' ? item.content : item.title || item.topic}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              By {author?.username} • {new Date(item.created_at).toLocaleDateString()}
            </p>
            {type !== 'comment' && item.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <a
            href={`/${type}s/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    );
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

  const totalQuarantined =
    quarantinedContent.discussions.length +
    quarantinedContent.comments.length +
    quarantinedContent.debates.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Moderation Queue</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review and moderate flagged content
            </p>
          </div>
          {totalQuarantined > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Select All
            </button>
          )}
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'all' as const, label: 'All' },
            { key: 'discussion' as const, label: 'Discussions' },
            { key: 'comment' as const, label: 'Comments' },
            { key: 'debate' as const, label: 'Debates' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {totalQuarantined === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No content in queue
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All quarantined content has been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(activeTab === 'all' || activeTab === 'discussion') &&
              quarantinedContent.discussions.map((item: any) =>
                renderContentItem(item, 'discussion')
              )}
            {(activeTab === 'all' || activeTab === 'comment') &&
              quarantinedContent.comments.map((item: any) => renderContentItem(item, 'comment'))}
            {(activeTab === 'all' || activeTab === 'debate') &&
              quarantinedContent.debates.map((item: any) => renderContentItem(item, 'debate'))}
          </div>
        )}

        <BulkActionBar
          selectedCount={selectedItems.size}
          onApprove={handleBulkApprove}
          onRemove={handleBulkRemove}
          onClear={() => setSelectedItems(new Set())}
          showApprove
          showRemove
        />
      </div>
    </AdminLayout>
  );
}
