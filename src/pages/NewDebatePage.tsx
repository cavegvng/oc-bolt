import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Scale } from 'lucide-react';

type Category = Database['public']['Tables']['categories']['Row'];

export function NewDebatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    category_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/debates');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setError('You must be signed in to create a debate');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Topic is required');
      return;
    }

    setSubmitting(true);
    setError('');

    const { data, error: insertError } = await supabase
      .from('debates')
      .insert({
        author_id: user.id,
        topic: formData.topic.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
      })
      .select()
      .single();

    if (insertError) {
      setError('Failed to create debate. Please try again.');
      setSubmitting(false);
      return;
    }

    if (data) {
      navigate(`/debates/${data.id}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/debates')}
        className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Debates
      </button>

      <div className="bg-card rounded-3xl p-8 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-foreground">
            Start a New Debate
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Present a topic. Let others choose sides.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-red-800 dark:text-red-400">{error}</p>
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

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/debates')}
              className="px-6 py-3 text-foreground font-medium hover:bg-accent rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.topic.trim()}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-2xl transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Debate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
