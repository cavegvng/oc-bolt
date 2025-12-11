import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  MessageSquare,
  ThumbsUp,
  Award,
  Calendar,
  Edit2,
  TrendingUp,
  Instagram,
  Twitter,
  Youtube,
  Eye,
  Scale,
  Trophy,
  Music,
} from 'lucide-react';
import { ProfileComments } from '../components/ProfileComments';
import type { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];
type ExtendedProfile = Database['public']['Tables']['user_profiles']['Row'];
type Discussion = Database['public']['Tables']['discussions']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];
type Achievement = Database['public']['Tables']['user_achievements']['Row'] & {
  achievements_definitions: {
    name: string;
    description: string;
    icon: string;
    rarity: string;
  } | null;
};

const socialIcons = {
  instagram: Instagram,
  x: Twitter,
  youtube: Youtube,
  tiktok: Music,
};

export function EnhancedProfilePage() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [debates, setDebates] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [visitors, setVisitors] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [socialUrls, setSocialUrls] = useState({
    instagram: '',
    x: '',
    tiktok: '',
    youtube: '',
  });

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [profileRes, extProfileRes, discussionsRes, debatesRes, socialRes, achievementsRes, visitorsRes] =
        await Promise.all([
          supabase.from('users').select('*').eq('id', userId).single(),
          supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase
            .from('discussions')
            .select('*')
            .eq('author_id', userId)
            .eq('moderation_status', 'approved')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('debates').select('*').eq('author_id', userId).order('created_at', { ascending: false }).limit(5),
          supabase.from('social_links').select('*').eq('user_id', userId),
          supabase
            .from('user_achievements')
            .select('*, achievements_definitions(*)')
            .eq('user_id', userId)
            .not('earned_at', 'is', null)
            .order('earned_at', { ascending: false }),
          supabase.from('profile_visitors').select('id', { count: 'exact', head: true }).eq('profile_id', userId),
        ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setBio(profileRes.data.bio || '');
        setUsername(profileRes.data.username);
      }
      if (extProfileRes.data) {
        setExtendedProfile(extProfileRes.data);
        setCustomStatus(extProfileRes.data.custom_status || '');
      }
      if (discussionsRes.data) setDiscussions(discussionsRes.data);
      if (debatesRes.data) setDebates(debatesRes.data);
      if (socialRes.data) {
        setSocialLinks(socialRes.data);
        const urls = {
          instagram: '',
          x: '',
          tiktok: '',
          youtube: '',
        };
        socialRes.data.forEach((link) => {
          urls[link.platform as keyof typeof urls] = link.url;
        });
        setSocialUrls(urls);
      }
      if (achievementsRes.data) setAchievements(achievementsRes.data);
      if (visitorsRes.count !== null) setVisitors(visitorsRes.count);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    try {
      await supabase.from('users').update({ bio, username }).eq('id', user.id);

      if (extendedProfile) {
        await supabase.from('user_profiles').update({ custom_status: customStatus }).eq('user_id', user.id);
      } else {
        await supabase.from('user_profiles').insert({ user_id: user.id, custom_status: customStatus });
      }

      await supabase.from('social_links').delete().eq('user_id', user.id);

      const socialLinksToInsert = Object.entries(socialUrls)
        .filter(([_, url]) => url.trim() !== '')
        .map(([platform, url]) => ({
          user_id: user.id,
          platform,
          url: url.trim(),
        }));

      if (socialLinksToInsert.length > 0) {
        await supabase.from('social_links').insert(socialLinksToInsert);
      }

      setProfile({ ...profile, bio, username });
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
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
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-red-600 to-orange-600"></div>

        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-muted border-4 border-white dark:border-border flex items-center justify-center text-4xl font-bold text-gray-600 dark:text-gray-300">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-foreground">{username}</h1>
                {customStatus && (
                  <p className="text-muted-foreground italic">{customStatus}</p>
                )}
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            {!editing && user && userId === user.id && (
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
                <label className="block text-sm font-medium text-foreground mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="What's your current mood?"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Social Media Links</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Instagram</label>
                    <input
                      type="url"
                      value={socialUrls.instagram}
                      onChange={(e) => setSocialUrls({ ...socialUrls, instagram: e.target.value })}
                      placeholder="https://instagram.com/username"
                      className="w-full px-3 py-2 text-sm border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">X (Twitter)</label>
                    <input
                      type="url"
                      value={socialUrls.x}
                      onChange={(e) => setSocialUrls({ ...socialUrls, x: e.target.value })}
                      placeholder="https://x.com/username"
                      className="w-full px-3 py-2 text-sm border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">TikTok</label>
                    <input
                      type="url"
                      value={socialUrls.tiktok}
                      onChange={(e) => setSocialUrls({ ...socialUrls, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@username"
                      className="w-full px-3 py-2 text-sm border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">YouTube</label>
                    <input
                      type="url"
                      value={socialUrls.youtube}
                      onChange={(e) => setSocialUrls({ ...socialUrls, youtube: e.target.value })}
                      placeholder="https://youtube.com/@username"
                      className="w-full px-3 py-2 text-sm border border-border rounded-2xl focus:ring-2 focus:ring-red-500 bg-white dark:bg-muted text-foreground"
                    />
                  </div>
                </div>
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
                    setCustomStatus(extendedProfile?.custom_status || '');
                    const urls = {
                      instagram: '',
                      x: '',
                      tiktok: '',
                      youtube: '',
                    };
                    socialLinks.forEach((link) => {
                      urls[link.platform as keyof typeof urls] = link.url;
                    });
                    setSocialUrls(urls);
                  }}
                  className="px-4 py-2 bg-muted hover:bg-gray-300 dark:hover:bg-accent text-foreground rounded-2xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground mt-4">{profile.bio || 'No bio yet'}</p>
          )}

          {socialLinks.length > 0 && (
            <div className="flex gap-3 mt-4">
              {socialLinks.map((link) => {
                const Icon = socialIcons[link.platform as keyof typeof socialIcons];
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-accent rounded-2xl transition-colors"
                  >
                    <Icon className="w-5 h-5 text-foreground" />
                  </a>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <MessageSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">{discussions.length}</p>
              <p className="text-sm text-muted-foreground">Discussions</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">{debates.length}</p>
              <p className="text-sm text-muted-foreground">Debates</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <ThumbsUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">{profile.reputation_points}</p>
              <p className="text-sm text-muted-foreground">Reputation</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">{achievements.length}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-foreground">{visitors}</p>
              <p className="text-sm text-muted-foreground">Visitors</p>
            </div>
          </div>

          {achievements.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Achievements
              </h3>
              <div className="flex flex-wrap gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getRarityColor(
                      achievement.achievements_definitions?.rarity || 'common'
                    )} rounded-full shadow-lg`}
                    title={achievement.achievements_definitions?.description}
                  >
                    <Trophy className="w-5 h-5 text-white" />
                    <span className="text-white font-medium text-sm">
                      {achievement.achievements_definitions?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6">
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

        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Debates</h3>
          {debates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No debates yet</p>
          ) : (
            <div className="space-y-3">
              {debates.map((debate) => (
                <Link
                  key={debate.id}
                  to={`/debates/${debate.id}`}
                  className="block p-4 border border-border rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{debate.topic}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(debate.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6">
        <ProfileComments profileId={userId!} />
      </div>
    </div>
  );
}
