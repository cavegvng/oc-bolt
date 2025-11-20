import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageSquare, ThumbsUp, Award, Calendar, Edit2, TrendingUp } from 'lucide-react';
import type { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];
type Discussion = Database['public']['Tables']['discussions']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];
type Badge = Database['public']['Tables']['user_badges']['Row'];

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [profileRes, discussionsRes, commentsRes, badgesRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('discussions').select('*').eq('author_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('comments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('user_badges').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setBio(profileRes.data.bio || '');
        setUsername(profileRes.data.username);
      }
      if (discussionsRes.data) setDiscussions(discussionsRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
      if (badgesRes.data) setBadges(badgesRes.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ bio, username })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, bio, username });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-red-600 to-orange-600"></div>

          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <div className="flex items-end gap-4">
                <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-muted border-4 border-white dark:border-border flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-foreground">{username}</h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-2xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-muted text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-2xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-muted text-foreground"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setBio(profile.bio || '');
                      setUsername(profile.username);
                    }}
                    className="px-4 py-2 bg-muted hover:bg-gray-300 dark:hover:bg-accent text-foreground rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground mt-4">
                {profile.bio || 'No bio yet'}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <MessageSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{discussions.length}</p>
                <p className="text-sm text-muted-foreground">Discussions</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{comments.length}</p>
                <p className="text-sm text-muted-foreground">Comments</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <ThumbsUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{profile.reputation_points}</p>
                <p className="text-sm text-muted-foreground">Reputation</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{badges.length}</p>
                <p className="text-sm text-muted-foreground">Badges</p>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
                    >
                      <Award className="w-5 h-5 text-white" />
                      <span className="text-white font-medium text-sm">{badge.badge_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Recent Discussions</h3>
            {discussions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No discussions yet</p>
            ) : (
              <div className="space-y-3">
                {discussions.map((discussion) => (
                  <Link
                    key={discussion.id}
                    to={`/discussions/${discussion.id}`}
                    className="block p-4 border border-border rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{discussion.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(discussion.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {discussion.view_count} views
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Recent Comments</h3>
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border border-border rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="text-foreground text-sm mb-2 line-clamp-2">{comment.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {comment.upvotes}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
