import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Scale, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { updateDebate } from '../services/debate-service';

type Category = Database['public']['Tables']['categories']['Row'];
type Debate = Database['public']['Tables']['debates']['Row'];

export function EditDebatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [debate, setDebate] = useState<Debate | null>(null);
  const [lastEditor, setLastEditor] = useState<{ username: string } | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    category_id: '',
    durationType: 'none' as 'none' | 'days' | 'date',
    duration_days: '',
    end_date: '',
    is_locked: false,
    is_featured: false,
    moderation_status: 'approved' as 'approved' | 'pending' | 'quarantined' | 'removed',
  });
  const [initialFormData, setInitialFormData] = useState(formData);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isSuperModOrAbove = role && ['owner', 'admin', 'super_moderator'].includes(role);

  useEffect(() => {
    if (!user || !id) {
      navigate('/debates');
      return;
    }
    fetchDebate();
    fetchCategories();
  }, [user, id, navigate]);

  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialFormData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  async function fetchDebate() {
    if (!id) return;

    const { data, error: fetchError } = await supabase
      .from('debates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !data) {
      setError('Debate not found');
      setLoading(false);
      return;
    }

    if (data.author_id !== user?.id && !isSuperModOrAbove) {
      setError('You do not have permission to edit this debate');
      setLoading(false);
      return;
    }

    setDebate(data);

    let durationType: 'none' | 'days' | 'date' = 'none';
    if (data.end_date) {
      durationType = data.duration_days ? 'days' : 'date';
    }

    const initialData = {
      topic: data.topic,
      description: data.description || '',
      category_id: data.category_id || '',
      durationType,
      duration_days: data.duration_days?.toString() || '',
      end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
      is_locked: data.is_locked,
      is_featured: data.is_featured,
      moderation_status: data.moderation_status,
    };

    setFormData(initialData);
    setInitialFormData(initialData);

    if (data.last_edited_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.last_edited_by)
        .maybeSingle();

      if (userData) {
        setLastEditor(userData);
      }
    }

    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  }

  function getTimeRemaining() {
    if (!debate?.end_date) return null;

    const endDate = new Date(debate.end_date);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Concluded';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Less than 1 hour remaining';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !id || !role) {
      setError('You must be signed in to edit a debate');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Topic is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updates: Parameters<typeof updateDebate>[0]['updates'] = {
        topic: formData.topic.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
      };

      if (formData.durationType === 'days' && formData.duration_days) {
        updates.duration_days = parseInt(formData.duration_days, 10);
      } else if (formData.durationType === 'date' && formData.end_date) {
        updates.end_date = new Date(formData.end_date).toISOString();
        updates.duration_days = null;
      } else {
        updates.end_date = null;
        updates.duration_days = null;
      }

      if (isSuperModOrAbove) {
        updates.is_locked = formData.is_locked;
        updates.is_featured = formData.is_featured;
        updates.moderation_status = formData.moderation_status;
      }

      await updateDebate({
        debateId: id,
        userId: user.id,
        userRole: role,
        updates,
      });

      setHasUnsavedChanges(false);
      navigate(`/debates/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update debate. Please try again.');
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(`/debates/${id}`);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-3xl p-8 border border-border">
          <p className="text-center text-muted-foreground">Loading debate...</p>
        </div>
      </div>
    );
  }

  if (error && !debate) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-3xl p-8 border border-border">
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => navigate('/debates')}
            className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent/80 rounded-2xl transition-colors"
          >
            Back to Debates
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={handleCancel}
        className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Debate
      </button>

      <div className="bg-card rounded-3xl p-8 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">
            Edit Debate
          </h1>
        </div>

        {debate?.last_edited_at && lastEditor && (
          <p className="text-sm text-muted-foreground mb-4">
            Last edited {new Date(debate.last_edited_at).toLocaleDateString()} by {lastEditor.username}
          </p>
        )}

        {timeRemaining && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-blue-800 dark:text-blue-400 font-medium">{timeRemaining}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-400">You have unsaved changes</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-2">
              Debate Topic *
            </label>
            <input
              type="text"
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Should pineapple be allowed on pizza?"
              className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              maxLength={200}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.topic.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select a category (optional)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Context & Background
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context, definitions, or background information to help people understand the debate..."
              className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Time Duration
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-border rounded-2xl cursor-pointer hover:bg-accent transition-colors">
                <input
                  type="radio"
                  name="durationType"
                  value="none"
                  checked={formData.durationType === 'none'}
                  onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'none' })}
                  className="w-4 h-4"
                />
                <span className="text-foreground">No time limit</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border rounded-2xl cursor-pointer hover:bg-accent transition-colors">
                <input
                  type="radio"
                  name="durationType"
                  value="days"
                  checked={formData.durationType === 'days'}
                  onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'days' })}
                  className="w-4 h-4"
                />
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Set duration in days</span>
              </label>

              {formData.durationType === 'days' && (
                <div className="ml-10">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    placeholder="Number of days"
                    className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 p-3 border border-border rounded-2xl cursor-pointer hover:bg-accent transition-colors">
                <input
                  type="radio"
                  name="durationType"
                  value="date"
                  checked={formData.durationType === 'date'}
                  onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'date' })}
                  className="w-4 h-4"
                />
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Set specific end date</span>
              </label>

              {formData.durationType === 'date' && (
                <div className="ml-10">
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {isSuperModOrAbove && (
            <div className="pt-6 border-t border-border space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Staff Controls</h3>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_locked}
                  onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-foreground">Lock debate (prevent new stances)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-foreground">Feature debate</span>
              </label>

              <div>
                <label htmlFor="moderation_status" className="block text-sm font-medium text-foreground mb-2">
                  Moderation Status
                </label>
                <select
                  id="moderation_status"
                  value={formData.moderation_status}
                  onChange={(e) => setFormData({ ...formData, moderation_status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="quarantined">Quarantined</option>
                  <option value="removed">Removed</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 text-foreground font-medium hover:bg-accent rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.topic.trim() || !hasUnsavedChanges}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-2xl transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
