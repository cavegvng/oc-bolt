import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Heart, User as UserIcon } from 'lucide-react';
import { UserLink } from './UserLink';

type ProfileComment = Database['public']['Tables']['profile_comments']['Row'] & {
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
};

interface ProfileCommentsProps {
  profileId: string;
}

export function ProfileComments({ profileId }: ProfileCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [profileId]);

  async function fetchComments() {
    const { data } = await supabase
      .from('profile_comments')
      .select('*, users!profile_comments_author_id_fkey(username, avatar_url)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (data) setComments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('profile_comments')
      .insert({
        profile_id: profileId,
        author_id: user.id,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
      fetchComments();
    }

    setSubmitting(false);
  }

  async function handleLike(commentId: string) {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    await supabase
      .from('profile_comments')
      .update({ likes: (comment.likes || 0) + 1 })
      .eq('id', commentId);

    fetchComments();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">
          Wall ({comments.length})
        </h3>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="bg-muted rounded-lg p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write something on this wall..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to write on this wall!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-card rounded-lg p-4 border border-border"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    <UserLink userId={comment.author_id} username={comment.users?.username || 'Anonymous'} inline />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-foreground mb-3">{comment.content}</p>
              <button
                onClick={() => handleLike(comment.id)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                disabled={!user}
              >
                <Heart className="w-4 h-4" />
                <span>{comment.likes || 0}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
