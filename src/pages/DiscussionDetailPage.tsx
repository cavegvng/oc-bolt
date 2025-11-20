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
import { MarkdownRenderer } from '../components/MarkdownRenderer';
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

  // ... (all your useEffect, fetch functions, handle functions stay exactly the same) ...
  // I'm keeping them unchanged – everything above the return is identical to what you had

  // ONLY THE RETURN IS UPDATED BELOW ↓↓↓

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
        {/* Category badges + action buttons */}
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
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            {canModerateDiscussions && (
              <button
                onClick={() => setModerationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
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

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {discussion.title}
        </h1>

        {/* Author + meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
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

        {/* 🔥 EMBEDS AT THE TOP 🔥 */}
        <div className="space-y-8 mb-10">
          {discussion.twitter_url && <UniversalEmbed url={discussion.twitter_url} />}
          {discussion.instagram_url && <UniversalEmbed url={discussion.instagram_url} />}
          {discussion.youtube_url && <UniversalEmbed url={discussion.youtube_url} />}
        </div>

        {/* Description text – now comes AFTER the embeds */}
        <div className="prose prose-invert max-w-none mb-8">
          <MarkdownRenderer content={discussion.description} />
        </div>

        {/* Optional cover image */}
        {discussion.image_url && (
          <img
            src={discussion.image_url}
            alt="Discussion cover"
            className="rounded-2xl mt-8 max-h-96 object-cover w-full"
          />
        )}
      </div>

      {/* Comments section – unchanged */}
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
              <div key={comment.id} className="border-l-2 border-border pl-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-medium text-foreground">
                    {comment.users?.username || 'Anonymous'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
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

      {/* Modals */}
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