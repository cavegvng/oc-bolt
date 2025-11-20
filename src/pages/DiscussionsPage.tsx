import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { MessageSquare, ThumbsUp, Eye, Clock, Filter, Trash2, Tag, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/use-permissions';
import { BulkCategoryModal } from '../components/BulkCategoryModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { bulkDeleteDiscussions, bulkUpdateCategories } from '../services/delete-service';

type Discussion = Database['public']['Tables']['discussions']['Row'] & {
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
  categories: {
    name: string;
    color: string;
    slug: string;
  } | null;
  last_activity_user?: {
    username: string;
  } | null;
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
};

type Category = Database['public']['Tables']['categories']['Row'];

export function DiscussionsPage() {
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [loading, setLoading] = useState(true);
  const [selectedDiscussions, setSelectedDiscussions] = useState<Set<string>>(new Set());
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const canModerate = hasRole('moderator');

  useEffect(() => {
    fetchCategories();
    fetchDiscussions();
  }, [selectedCategory, sortBy, user]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  }

  async function fetchDiscussions() {
    setLoading(true);

    let query = supabase
      .from('discussions')
      .select(`
        *,
        users!discussions_author_id_fkey (username, avatar_url),
        categories (name, color, slug)
      `)
      .eq('moderation_status', 'approved');

    if (selectedCategory) {
      query = query.contains('category_ids', [selectedCategory]);
    }

    if (sortBy === 'recent') {
      query = query.order('last_activity_at', { ascending: false });
    } else if (sortBy === 'popular') {
      query = query.order('view_count', { ascending: false });
    } else if (sortBy === 'trending') {
      query = query.order('last_activity_at', { ascending: false });
    }

    const { data } = await query.limit(20);

    if (data) {
      const discussionsWithCounts = await Promise.all(
        data.map(async (discussion) => {
          const [likesResult, commentsResult, lastActivityUserResult, userLikeResult] = await Promise.all([
            supabase
              .from('discussion_likes')
              .select('id', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id),
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id),
            discussion.last_activity_user_id
              ? supabase
                  .from('users')
                  .select('username')
                  .eq('id', discussion.last_activity_user_id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
            user
              ? supabase
                  .from('discussion_likes')
                  .select('id')
                  .eq('discussion_id', discussion.id)
                  .eq('user_id', user.id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...discussion,
            like_count: likesResult.count || 0,
            comment_count: commentsResult.count || 0,
            last_activity_user: lastActivityUserResult.data,
            user_has_liked: !!userLikeResult.data,
          };
        })
      );

      setDiscussions(discussionsWithCounts);
    }

    setLoading(false);
  }

  async function handleToggleLike(discussionId: string, currentlyLiked: boolean) {
    if (!user) {
      alert('Please sign in to like discussions');
      return;
    }

    if (currentlyLiked) {
      await supabase
        .from('discussion_likes')
        .delete()
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('discussion_likes')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
        });
    }

    fetchDiscussions();
  }

  function toggleSelectDiscussion(id: string) {
    const newSelected = new Set(selectedDiscussions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDiscussions(newSelected);
  }

  function toggleSelectAll() {
    if (selectedDiscussions.size === discussions.length && discussions.length > 0) {
      setSelectedDiscussions(new Set());
    } else {
      setSelectedDiscussions(new Set(discussions.map(d => d.id)));
    }
  }

  async function handleBulkDelete() {
    if (!user || selectedDiscussions.size === 0) return;

    setBulkLoading(true);
    const result = await bulkDeleteDiscussions(Array.from(selectedDiscussions), user.id);
    setBulkLoading(false);

    if (result.success) {
      setSelectedDiscussions(new Set());
      setDeleteModalOpen(false);
      fetchDiscussions();
    } else {
      alert(result.error || 'Failed to delete discussions');
    }
  }

  async function handleBulkUpdateCategories(categoryIds: string[]) {
    if (!user || selectedDiscussions.size === 0) return;

    setBulkLoading(true);
    const result = await bulkUpdateCategories(Array.from(selectedDiscussions), categoryIds, user.id);
    setBulkLoading(false);

    if (result.success) {
      setSelectedDiscussions(new Set());
      setBulkCategoryModalOpen(false);
      fetchDiscussions();
    } else {
      alert(result.error || 'Failed to update categories');
    }
  }

  function formatTimeAgo(date: string) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  }

  function getInitials(username: string) {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Discussions
          </h1>
          <p className="text-muted-foreground mt-1">
            Join the conversation that never logs off
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canModerate && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl text-foreground hover:bg-accent transition-colors"
              title={selectedDiscussions.size === discussions.length && discussions.length > 0 ? 'Deselect All' : 'Select All'}
            >
              {selectedDiscussions.size === discussions.length && discussions.length > 0 ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Select</span>
            </button>
          )}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-10 pr-10 py-2 bg-card border border-border rounded-2xl text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
              <option value="trending">Trending</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-red-600 text-white'
              : 'bg-card text-foreground hover:bg-accent'
          }`}
        >
          All Topics
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'text-white'
                : 'bg-card text-foreground hover:bg-accent'
            }`}
            style={
              selectedCategory === category.id
                ? { backgroundColor: category.color }
                : {}
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-4 animate-pulse border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <div className="bg-card rounded-3xl p-12 text-center border border-border">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No discussions yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Be the first to start a conversation in this category!
          </p>
          <Link
            to="/discussions/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-2xl transition-colors"
          >
            Start a Discussion
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              className={`bg-card rounded-2xl border transition-all ${
                selectedDiscussions.has(discussion.id)
                  ? 'border-red-500 shadow-md'
                  : 'border-border hover:border-red-500/50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {canModerate && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSelectDiscussion(discussion.id);
                    }}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {selectedDiscussions.has(discussion.id) ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}
                <Link
                  to={`/profile/${discussion.author_id}`}
                  className="flex-shrink-0"
                >
                  {discussion.users?.avatar_url ? (
                    <img
                      src={discussion.users.avatar_url}
                      alt={discussion.users.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: discussion.categories?.color || '#666' }}
                    >
                      {getInitials(discussion.users?.username || 'A')}
                    </div>
                  )}
                </Link>

                <Link
                  to={`/discussions/${discussion.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {discussion.is_pinned && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        Pinned
                      </span>
                    )}
                    {discussion.categories && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: discussion.categories.color }}
                      >
                        {discussion.categories.name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1 hover:text-red-600 transition-colors">
                    {discussion.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {discussion.description}
                  </p>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {discussion.last_activity_user && discussion.last_activity_user_id !== discussion.author_id ? (
                      <>
                        <span className="font-medium text-foreground">
                          {discussion.last_activity_user.username}
                        </span>
                        <span>replied</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(discussion.last_activity_at)}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">
                          {discussion.users?.username || 'Anonymous'}
                        </span>
                        <span>started</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(discussion.created_at)}
                        </div>
                      </>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{discussion.view_count}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleLike(discussion.id, discussion.user_has_liked || false);
                    }}
                    className={`flex items-center gap-1 transition-colors ${
                      discussion.user_has_liked
                        ? 'text-red-600 dark:text-red-400'
                        : 'hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-4 h-4 ${discussion.user_has_liked ? 'fill-current' : ''}`}
                    />
                    <span className="font-medium">{discussion.like_count || 0}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium">{discussion.comment_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {canModerate && selectedDiscussions.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-3xl shadow-2xl p-4 flex items-center gap-4 z-50">
          <span className="text-foreground font-medium">
            {selectedDiscussions.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-2xl font-medium transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Change Categories</span>
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-2xl font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedDiscussions(new Set())}
              className="px-4 py-2 bg-accent hover:bg-accent/70 text-foreground rounded-2xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BulkCategoryModal
        isOpen={bulkCategoryModalOpen}
        onClose={() => setBulkCategoryModalOpen(false)}
        onConfirm={handleBulkUpdateCategories}
        selectedCount={selectedDiscussions.size}
        loading={bulkLoading}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Discussions"
        message={`Are you sure you want to delete ${selectedDiscussions.size} discussion${selectedDiscussions.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        loading={bulkLoading}
      />
    </div>
  );
}
