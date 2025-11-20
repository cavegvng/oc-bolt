import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/admin-layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  Layout,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getHomepageSections,
  updateSectionVisibility,
  updateSectionOrder,
  getHomepageControlAuditLog,
} from '../../services/homepage-controls-service';
import type { Database } from '../../lib/database.types';

type HomepageSectionControl = Database['public']['Tables']['homepage_section_controls']['Row'];
type AuditLogEntry = Database['public']['Tables']['homepage_control_audit_log']['Row'] & {
  users?: {
    username: string;
    email: string;
  } | null;
};

export function HomepageControlsPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<HomepageSectionControl[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsData, auditData] = await Promise.all([
        getHomepageSections(),
        getHomepageControlAuditLog(20),
      ]);
      setSections(sectionsData);
      setAuditLog(auditData);
    } catch (error) {
      console.error('Error loading homepage controls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (sectionId: string, currentVisibility: boolean) => {
    if (!user) return;

    try {
      await updateSectionVisibility(sectionId, !currentVisibility, user.id);
      setSections(prev =>
        prev.map(s => (s.id === sectionId ? { ...s, is_visible: !currentVisibility } : s))
      );
      await loadData();
    } catch (error) {
      console.error('Error toggling section visibility:', error);
      alert('Failed to update section visibility. Please try again.');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const draggedSection = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);

    setSections(newSections);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const updates = sections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
      }));

      await updateSectionOrder(updates, user.id);
      setHasChanges(false);
      await loadData();
      alert('Section order saved successfully!');
    } catch (error) {
      console.error('Error saving section order:', error);
      alert('Failed to save section order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the order? This will discard unsaved changes.')) {
      await loadData();
      setHasChanges(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    setSections(newSections);
    setHasChanges(true);
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Layout className="w-8 h-8 text-blue-600" />
              Homepage Controls
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage which sections appear on the homepage and their display order
            </p>
          </div>
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <History className="w-5 h-5" />
            {showAuditLog ? 'Hide' : 'View'} Audit Log
          </button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                You have unsaved changes to section order
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Homepage Sections</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Toggle visibility or drag to reorder sections
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  draggedIndex === index ? 'opacity-50' : ''
                } cursor-move`}
              >
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />

                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-semibold flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {section.section_name}
                  </h3>
                  {section.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Key: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{section.section_key}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => handleToggleVisibility(section.id, section.is_visible)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                    section.is_visible
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {section.is_visible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hidden
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {showAuditLog && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Recent changes to homepage controls
              </p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {auditLog.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No audit log entries yet
                </p>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {entry.users?.username || 'System'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">•</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.action_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{entry.field_changed}</span>
                          {entry.old_value && entry.new_value && (
                            <>
                              : <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">{entry.old_value}</code>
                              {' → '}
                              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">{entry.new_value}</code>
                            </>
                          )}
                        </div>
                      </div>
                      <time className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </time>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
