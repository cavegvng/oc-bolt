import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { MarkdownToolbar } from '../components/MarkdownToolbar';
import { MarkdownBadge } from '../components/MarkdownGuide';
import { CategorySelector } from '../components/CategorySelector';
import { FormField } from '../components/FormField';

type Category = Database['public']['Tables']['categories']['Row'];

export function NewDiscussionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_ids: [] as string[],
    image_url: '',
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/discussions');
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
      setError('You must be signed in to create a discussion');
      return;
    }

    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = `Description must be at least 50 characters (currently ${formData.description.trim().length})`;
    }

    if (formData.category_ids.length === 0) {
      errors.categories = 'Please select at least one category';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    setSubmitting(true);
    setError('');

    try {
      const urls = formData.description.match(/https?:\/\/[^\s]+/g) || [];
      const twitter_url = urls.find(u => u.includes('x.com') || u.includes('twitter.com')) || null;
      const instagram_url = urls.find(u => u.includes('instagram.com')) || null;
      const youtube_url = urls.find(u => u.includes('youtube.com') || u.includes('youtu.be')) || null;

      const { data, error: insertError } = await supabase
        .from('discussions')
        .insert({
          author_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category_ids: formData.category_ids,
          image_url: formData.image_url.trim() || null,
          thumbnail_url: formData.image_url.trim() || null,
          twitter_url,
          instagram_url,
          youtube_url,
          moderation_status: 'approved',
        })
        .select()
        .single();

      if (insertError) {
        setError('Failed to create discussion. Please try again.');
        setSubmitting(false);
        return;
      }

      if (data) {
        navigate(`/discussions/${data.id}`);
      }
    } catch (err) {
      setError('Failed to create discussion. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/discussions')}
        className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Discussions
      </button>

      <div className="bg-card rounded-3xl p-8 border border-border">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Start a New Discussion
        </h1>
        <p className="text-muted-foreground mb-8">
          Share your perspective. Make your voice heard.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Title"
            required
            tooltip="Choose a clear, engaging title that summarizes your discussion topic"
            error={validationErrors.title}
          >
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (validationErrors.title) {
                  setValidationErrors({ ...validationErrors, title: '' });
                }
              }}
              placeholder="What's on your mind?"
              className={`w-full px-4 py-3 border rounded-2xl bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                validationErrors.title ? 'border-red-500' : 'border-border'
              }`}
              maxLength={200}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.title.length}/200 characters
            </p>
          </FormField>

          <FormField
            label="Categories"
            required
            tooltip="Select 1-3 categories that best describe your discussion topic. This helps others find your content."
            error={validationErrors.categories}
          >
            <CategorySelector
              categories={categories}
              selectedIds={formData.category_ids}
              onChange={(categoryIds) => {
                setFormData({ ...formData, category_ids: categoryIds });
                if (validationErrors.categories) {
                  setValidationErrors({ ...validationErrors, categories: '' });
                }
              }}
            />
          </FormField>

          <FormField
            label="Description"
            required
            tooltip="Write a detailed description of your topic. You can use markdown formatting for rich text."
            error={validationErrors.description}
          >
            <div className="relative">
              <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  Tip: Paste links from Instagram, Twitter/X, or YouTube and they'll automatically embed
                </p>
                <div className="flex items-center gap-3">
                  <MarkdownBadge />
                  <p className="text-sm text-muted-foreground">
                    {formData.description.trim().length} characters
                  </p>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (validationErrors.description) {
                    setValidationErrors({ ...validationErrors, description: '' });
                  }
                }}
                placeholder="Share your thoughts... You can use **bold**, *italic*, and other markdown formatting. Paste Instagram, Twitter/X, or YouTube links to embed them."
                className={`w-full px-4 py-3 border rounded-2xl bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  validationErrors.description ? 'border-red-500' : 'border-border'
                }`}
                rows={10}
              />
              <MarkdownToolbar textareaRef={textareaRef} />
            </div>
          </FormField>

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Custom Thumbnail (Optional)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a background image for your discussion card.
            </p>

            <div>
              <label htmlFor="image_url" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <ImageIcon className="w-4 h-4" />
                Custom Thumbnail URL
              </label>
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {formData.image_url && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Card background preview:
                </p>
                <div className="relative h-32 rounded-lg overflow-hidden">
                  <img
                    src={formData.image_url}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/discussions')}
              className="px-6 py-3 text-foreground font-medium hover:bg-accent rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim() || !formData.description.trim() || formData.category_ids.length === 0 || formData.description.trim().length < 50}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
