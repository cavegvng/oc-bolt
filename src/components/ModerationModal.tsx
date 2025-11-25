import { useState, useEffect } from 'react';
import { X, Star, Megaphone, Pin, Info, Shield, AlertTriangle, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deleteDiscussion } from '../services/delete-service';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { logModerationAction } from '../services/moderation-service';

type Discussion = Database['public']['Tables']['discussions']['Row'];
type ModerationStatus = 'approved' | 'pending' | 'quarantined' | 'removed';
type Category = Database['public']['Tables']['categories']['Row'];

interface ModerationModalProps {
  discussion: Discussion;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ModerationModal({ discussion, isOpen, onClose, onUpdate }: ModerationModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(discussion.is_featured);
  const [isPromoted, setIsPromoted] = useState(discussion.is_promoted);
  const [isPinned, setIsPinned] = useState(discussion.is_pinned);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>(
    (discussion.moderation_status as ModerationStatus) || 'approved'
  );
  const [moderationReason, setModerationReason] = useState('');
  const [promotedEndDate, setPromotedEndDate] = useState(
    discussion.promoted_end_date ? new Date(discussion.promoted_end_date).toISOString().slice(0, 16) : ''
  );
  const [pinOrder, setPinOrder] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(discussion.category_ids || []);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    moderation: true,
    categories: false,
    danger: false
  });

  useEffect(() => {
    setIsFeatured(discussion.is_featured);
    setIsPromoted(discussion.is_promoted);
    setIsPinned(discussion.is_pinned);
    setModerationStatus((discussion.moderation_status as ModerationStatus) || 'approved');
    setModerationReason('');
    setPromotedEndDate(
      discussion.promoted_end_date ? new Date(discussion.promoted_end_date).toISOString().slice(0, 16) : ''
    );
    setSelectedCategories(discussion.category_ids || []);
    fetchCategories();
  }, [discussion]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  }

  if (!isOpen) return null;

  const logAudit = async (actionType: string, fieldChanged: string, oldValue: any, newValue: any) => {
    await supabase.from('discussion_control_audit_log').insert({
      discussion_id: discussion.id,
      user_id: user?.id,
      action_type: actionType,
      field_changed: fieldChanged,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
    });
  };

  const sendNotification = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', user?.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data for notification:', userError);
        return;
      }

      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: discussion.author_id,
        type: 'discussion_featured',
        title: 'Your discussion has been featured!',
        content: `Your discussion "${discussion.title}" has been featured by ${userData?.username || 'a moderator'}`,
        link_url: `/discussions/${discussion.id}`,
      });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
      } else {
        console.log('Notification sent successfully to user:', discussion.author_id);
      }
    } catch (error) {
      console.error('Exception in sendNotification:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const currentStatus = (discussion.moderation_status as ModerationStatus) || 'approved';
    if (moderationStatus !== currentStatus && ['quarantined', 'removed'].includes(moderationStatus) && !moderationReason.trim()) {
      alert('Please provide a reason for quarantining or removing this discussion.');
      return;
    }

    setLoading(true);
    try {
      const updates: any = {};
      const promises: Promise<any>[] = [];

      if (moderationStatus !== currentStatus) {
        updates.moderation_status = moderationStatus;
        updates.moderated_by = user.id;
        updates.last_moderation_action = new Date().toISOString();

        promises.push(
          logAudit(
            `moderation_${moderationStatus}`,
            'moderation_status',
            currentStatus,
            moderationStatus
          )
        );

        if (['quarantined', 'removed'].includes(moderationStatus)) {
          promises.push(
            supabase.from('content_restrictions').insert({
              content_type: 'discussion',
              content_id: discussion.id,
              restriction_type: moderationStatus,
              moderator_id: user.id,
              reason: moderationReason.trim(),
            })
          );
          promises.push(
            logModerationAction(
              user.id,
              moderationStatus === 'quarantined' ? 'quarantine' : 'remove',
              'discussion',
              discussion.id,
              moderationReason.trim(),
              { old_status: currentStatus, new_status: moderationStatus }
            )
          );
        } else if (moderationStatus === 'active' && ['quarantined', 'removed'].includes(currentStatus)) {
          promises.push(
            supabase.from('content_restrictions').insert({
              content_type: 'discussion',
              content_id: discussion.id,
              restriction_type: 'restored',
              moderator_id: user.id,
              reason: moderationReason.trim() || 'Content restored by moderator',
            })
          );
          promises.push(
            logModerationAction(
              user.id,
              'restore',
              'discussion',
              discussion.id,
              moderationReason.trim() || 'Content restored by moderator',
              { old_status: currentStatus, new_status: moderationStatus }
            )
          );
        } else if (moderationStatus === 'approved' && currentStatus !== 'approved') {
          promises.push(
            logModerationAction(
              user.id,
              'approve',
              'discussion',
              discussion.id,
              'Content approved',
              { old_status: currentStatus, new_status: moderationStatus }
            )
          );
        }
      }

      if (isFeatured !== discussion.is_featured) {
        updates.is_featured = isFeatured;
        updates.featured_at = isFeatured ? new Date().toISOString() : null;
        updates.featured_by = isFeatured ? user.id : null;
        promises.push(
          logAudit(
            isFeatured ? 'featured' : 'unfeatured',
            'is_featured',
            discussion.is_featured,
            isFeatured
          )
        );
        promises.push(
          logModerationAction(
            user.id,
            'feature',
            'discussion',
            discussion.id,
            isFeatured ? 'Discussion featured' : 'Discussion unfeatured',
            { is_featured: isFeatured }
          )
        );
        if (isFeatured) {
          sendNotification();
        }
      }

      if (isPromoted !== discussion.is_promoted) {
        updates.is_promoted = isPromoted;
        updates.promoted_start_date = isPromoted ? new Date().toISOString() : null;
        updates.promoted_end_date = isPromoted && promotedEndDate ? new Date(promotedEndDate).toISOString() : null;
        updates.promoted_by = isPromoted ? user.id : null;
        promises.push(
          logAudit(
            isPromoted ? 'promoted' : 'unpromoted',
            'is_promoted',
            discussion.is_promoted,
            isPromoted
          )
        );
      } else if (isPromoted && promotedEndDate !== (discussion.promoted_end_date ? new Date(discussion.promoted_end_date).toISOString().slice(0, 16) : '')) {
        updates.promoted_end_date = promotedEndDate ? new Date(promotedEndDate).toISOString() : null;
        promises.push(
          logAudit(
            'promoted',
            'promoted_end_date',
            discussion.promoted_end_date,
            promotedEndDate ? new Date(promotedEndDate).toISOString() : null
          )
        );
      }

      if (isPinned !== discussion.is_pinned) {
        updates.is_pinned = isPinned;
        promises.push(
          logAudit(
            isPinned ? 'pinned' : 'unpinned',
            'is_pinned',
            discussion.is_pinned,
            isPinned
          )
        );
        promises.push(
          logModerationAction(
            user.id,
            'pin',
            'discussion',
            discussion.id,
            isPinned ? 'Discussion pinned' : 'Discussion unpinned',
            { is_pinned: isPinned }
          )
          );
      }

      if (JSON.stringify(selectedCategories) !== JSON.stringify(discussion.category_ids)) {
        updates.category_ids = selectedCategories;
        promises.push(
          logAudit(
            'category_update',
            'category_ids',
            discussion.category_ids,
            selectedCategories
          )
        );
      }

      if (Object.keys(updates).length > 0) {
        console.log('Updating discussion with:', updates);
        const { error } = await supabase
          .from('discussions')
          .update(updates)
          .eq('id', discussion.id);

        if (error) {
          console.error('Error updating discussion:', error);
          throw error;
        }

        console.log('Discussion updated successfully, executing audit logs...');
        await Promise.all(promises);
        onUpdate();
        onClose();
      } else {
        console.log('No changes detected, closing modal');
        onClose();
      }
    } catch (error) {
      console.error('Exception in handleSave:', error);
      alert('Failed to update discussion controls. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: 'moderation' | 'categories' | 'danger') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl border border-border max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Discussion Controls</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage discussion visibility and promotion</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          <div className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('moderation')}
              className="w-full flex items-center justify-between p-4 bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Moderation & Visibility</h3>
                  <p className="text-xs text-muted-foreground">Status, featured, promoted, pinned</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.moderation ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSections.moderation && (
              <div className="p-4 space-y-4 bg-card">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-foreground">Moderation Status</span>
                    {discussion.report_count > 0 && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {discussion.report_count} report{discussion.report_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {(['approved', 'pending', 'quarantined', 'removed'] as ModerationStatus[]).map((status) => (
                      <label
                        key={status}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          moderationStatus === status
                            ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-500'
                            : 'bg-white dark:bg-gray-800 border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="moderation_status"
                          value={status}
                          checked={moderationStatus === status}
                          onChange={(e) => setModerationStatus(e.target.value as ModerationStatus)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-foreground capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                  {['quarantined', 'removed'].includes(moderationStatus) && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Reason {['quarantined', 'removed'].includes(moderationStatus) && moderationStatus !== ((discussion.moderation_status as ModerationStatus) || 'approved') && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <textarea
                        value={moderationReason}
                        onChange={(e) => setModerationReason(e.target.value)}
                        placeholder="Provide a reason for this action..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-medium text-foreground text-sm">Featured</span>
                      <p className="text-xs text-muted-foreground">Display on homepage</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isFeatured ? 'bg-amber-500' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isFeatured ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="font-medium text-foreground text-sm">Promoted</span>
                      <p className="text-xs text-muted-foreground">Paid advertising</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPromoted(!isPromoted)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isPromoted ? 'bg-blue-500' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isPromoted ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {isPromoted && (
                  <div className="pl-3 mt-2 space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={promotedEndDate}
                      onChange={(e) => setPromotedEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for indefinite</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-red-500" />
                    <div>
                      <span className="font-medium text-foreground text-sm">Pinned</span>
                      <p className="text-xs text-muted-foreground">Top of category</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isPinned ? 'bg-red-500' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isPinned ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between p-4 bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Category Management</h3>
                  <p className="text-xs text-muted-foreground">{selectedCategories.length} selected</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSections.categories && (
              <div className="p-4 space-y-3 bg-card">
                <p className="text-sm text-muted-foreground">
                  Select 1-3 categories for this discussion
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          } else {
                            if (selectedCategories.length < 3) {
                              setSelectedCategories([...selectedCategories, category.id]);
                            }
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? 'text-white border-2 border-transparent'
                            : 'bg-accent text-foreground border-2 border-border hover:bg-accent/70'
                        }`}
                        style={isSelected ? { backgroundColor: category.color } : {}}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
                {selectedCategories.length === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400">At least one category is required</p>
                )}
              </div>
            )}
          </div>

          <div className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('danger')}
              className="w-full flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <h3 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">Permanent actions</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.danger ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSections.danger && (
              <div className="p-4 space-y-3 bg-card">
                <p className="text-sm text-muted-foreground">
                  Delete this discussion permanently. This action cannot be undone.
                </p>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 w-full justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Discussion
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/70 text-foreground font-medium rounded-xl transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || selectedCategories.length === 0}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={async () => {
            if (!user) return;
            setDeleting(true);
            const result = await deleteDiscussion(discussion.id, user.id);
            setDeleting(false);
            if (result.success) {
              onClose();
              navigate('/discussions');
            } else {
              alert(result.error || 'Failed to delete discussion');
              setDeleteModalOpen(false);
            }
          }}
          title="Delete Discussion"
          message={`Are you sure you want to delete "${discussion.title}"? This action cannot be undone and will permanently remove this discussion and all its comments.`}
          loading={deleting}
        />
      </div>
    </div>
  );
}
