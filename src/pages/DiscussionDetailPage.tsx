import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/use-permissions';
import {
  ThumbsUp,
  MessageSquare,
  Eye,
  Clock,
  ArrowLeft,
  Send,
  Settings,
  Edit,
  Loader2,
  Trash2
} from 'lucide-react';
import { ModerationModal } from '../components/ModerationModal';
import ReactMarkdown from 'react-markdown';
import UniversalEmbed from '../components/UniversalEmbed';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { deleteDiscussion } from '../services/delete-service';

type Discussion = Database['public']['Tables']['discussions']['Row'] & {
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
};

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type Comment = Database['public']['Tables']['comments']['Row'] & {
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
};

export function DiscussionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const canModerateDiscussions = hasRole('super_moderator');
  const isAuthor = user && discussion && user.id === discussion.author_id;
  const canDelete = isAuthor || canModerateDiscussions;

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  async function fetchAllData() {
    setLoading(true);
    setError(null);
    setIsRestricted(false);

    const results = await Promise.allSettled([
      fetchDiscussion(),
      fetchComments(),
      fetchLikes()
    ]);

    const discussionResult = results[0];
    if (discussionResult.status === 'rejected') {
      setError('Failed to load discussion');
    }

    setLoading(false);
  }

  async function fetchDiscussion() {
    try {
      console.log('Fetching discussion with ID:', id);

      const { data, error } = await supabase
        .from('discussions')
        .select('*, users!discussions_author_id_fkey(username, avatar_url)')
        .eq('id', id!)
        .maybeSingle();

      if (error) {
        console.error('Error fetching discussion:', error);
        throw error;
      }

      if (!data) {
        console.error('Discussion not found - no data returned for ID:', id);
        setDiscussion(null);
        return;
      }

      console.log('Discussion data loaded:', data);
      console.log('Moderation status:', data.moderation_status);

      const status = data.moderation_status || 'approved';
      const restricted = status === 'quarantined' || status === 'removed';
      const userCanModerate = hasRole('super_moderator');

      if (restricted && !userCanModerate) {
        console.log('Discussion is restricted and user is not a moderator');
        setIsRestricted(true);
        setDiscussion(null);
        return;
      }

      setDiscussion(data);

      if (data.category_ids && data.category_ids.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, color, icon')
          .in('id', data.category_ids);

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        } else if (categoriesData) {
          setCategories(categoriesData);
        }
      }

      incrementViewCount(data);
    } catch (error) {
      console.error('Exception in fetchDiscussion:', error);
      throw error;
    }
  }

  async function fetchComments() {
    try {
      console.log('Fetching comments for discussion:', id);

      const { data, error } = await supabase
        .from('comments')
        .select('*, users!comments_user_id_fkey(username, avatar_url)')
        .eq('discussion_id', id!)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      if (data) {
        console.log(`Loaded ${data.length} comments`);
        setComments(data);
      }
    } catch (error) {
      console.error('Exception in fetchComments:', error);
      throw error;
    }
  }

  async function fetchLikes() {
    try {
      console.log('Fetching likes for discussion:', id);

      const { count, error } = await supabase
        .from('discussion_likes')
        .select('id', { count: 'exact', head: true })
        .eq('discussion_id', id!);

      if (error) {
        console.error('Error fetching like count:', error);
        throw error;
      } else {
        setLikeCount(count || 0);
        console.log('Like count:', count);
      }

      if (user) {
        const { data, error: likeError } = await supabase
          .from('discussion_likes')
          .select('id')
          .eq('discussion_id', id!)
          .eq('user_id', user.id)
          .maybeSingle();

        if (likeError) {
          console.error('Error checking user like status:', likeError);
          throw likeError;
        } else {
          setUserHasLiked(!!data);
        }
      }
    } catch (error) {
      console.error('Exception in fetchLikes:', error);
      throw error;
    }
  }

  async function incrementViewCount(discussionData: Discussion) {
    try {
      console.log('Incrementing view count for discussion:', id);

      const { error } = await supabase
        .from('discussions')
        .update({ view_count: (discussionData.view_count || 0) + 1 })
        .eq('id', id!);

      if (error) {
        console.error('Error incrementing view count:', error);
      }
    } catch (error) {
      console.error('Exception in incrementViewCount:', error);
    }
  }

  async function handleToggleLike() {
    if (!user) {
      alert('Please sign in to like discussions');
      return;
    }

    const newLikedState = !userHasLiked;
    const newCount = newLikedState ? likeCount + 1 : likeCount - 1;

    setUserHasLiked(newLikedState);
    setLikeCount(newCount);

    try {
      if (userHasLiked) {
        const { error } = await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', id!)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: id!,
            user_id: user.id,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setUserHasLiked(!newLikedState);
      setLikeCount(likeCount);
    }
  }

  async function handleSubmitComment() {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('comments')
      .insert({
        discussion_id: id!,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
      fetchComments();
    }

    setSubmitting(false);
  }

  async function handleDelete() {
    if (!user || !id) return;

    setDeleting(true);
    const result = await deleteDiscussion(id, user.id);
    setDeleting(false);

    if (result.success) {
      navigate('/discussions');
    } else {
      alert(result.error || 'Failed to delete discussion');
      setDeleteModalOpen(false);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
          <p className="text-muted-foreground font-medium">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Error Loading Discussion
        </h2>
        <p className="text-muted-foreground mb-6">
          {error}
        </p>
        <button
          onClick={() => fetchAllData()}
          className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-2 mr-4"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate('/discussions')}
          className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discussions
        </button>
      </div>
    );
  }

  if (isRestricted || !discussion) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Discussion not available
        </h2>
        <p className="text-muted-foreground mb-6">
          This discussion may have been removed or you don't have permission to view it.
        </p>
        <button
          onClick={() => navigate('/discussions')}
          className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discussions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/discussions')}
        className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Discussions
      </button>

      <div className="bg-card rounded-3xl p-8 border border-border">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-2 flex-wrap">
            {categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthor && (
              <button
                onClick={() => navigate(`/discussions/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                title="Edit Discussion"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                title="Delete Discussion"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            {canModerateDiscussions && (
              <button
                onClick={() => setModerationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                title="Moderation Controls"
              >
                <Settings className="w-5 h-5" />
                <span>Moderation</span>
              </button>
            )}
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition-colors ${
                userHasLiked
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${userHasLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          {discussion.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="font-medium text-foreground">
            {discussion.users?.username || 'Anonymous'}
          </span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTimeAgo(discussion.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {discussion.view_count}
          </div>
        </div>

        <div className="prose max-w-none dark:prose-invert">
          <ReactMarkdown>{discussion.description}</ReactMarkdown>
        </div>

        <div className="space-y-8 mt-8">
          {discussion.twitter_url && <UniversalEmbed url={discussion.twitter_url} />}
          {discussion.instagram_url && <UniversalEmbed url={discussion.instagram_url} />}
          {discussion.youtube_url && <UniversalEmbed url={discussion.youtube_url} />}
        </div>

        {discussion.image_url && (
          <img
            src={discussion.image_url}
            alt=""
            className="rounded-2xl mb-6 max-h-96 object-cover w-full"
          />
        )}
      </div>

      <div className="bg-card rounded-3xl p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Comments ({comments.length})
        </h2>

        {user ? (
          <div className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-2xl transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl text-center">
            <p className="text-muted-foreground">
              Sign in to join the conversation
            </p>
          </div>
        )}

        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border-l-2 border-border pl-6 pb-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-medium text-foreground">
                    {comment.users?.username || 'Anonymous'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400">
                    <ThumbsUp className="w-4 h-4" />
                    {comment.upvotes}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {discussion && moderationModalOpen && (
        <ModerationModal
          discussion={discussion}
          isOpen={moderationModalOpen}
          onClose={() => setModerationModalOpen(false)}
          onUpdate={fetchAllData}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Discussion"
        message={`Are you sure you want to delete "${discussion?.title}"? This action cannot be undone and will permanently remove this discussion and all its comments.`}
        loading={deleting}
      />
    </div>
  );
}
