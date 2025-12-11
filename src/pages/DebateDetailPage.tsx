import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/use-permissions';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { UserLink } from '../components/UserLink';
import { deleteDebate } from '../services/delete-service';
import { Scale, ThumbsUp, ThumbsDown, Minus, ArrowLeft, Lock, User as UserIcon, AlertCircle, Info, Trash2 } from 'lucide-react';

type Debate = Database['public']['Tables']['debates']['Row'] & {
  users: {
    username: string;
  } | null;
  categories: {
    name: string;
    color: string;
  } | null;
};

type DebateStance = Database['public']['Tables']['debate_stances']['Row'] & {
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
  vote_score?: number;
};

type VoteTrend = Database['public']['Tables']['vote_trends']['Row'];

export function DebateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [stances, setStances] = useState<DebateStance[]>([]);
  const [userStance, setUserStance] = useState<DebateStance | null>(null);
  const [selectedStance, setSelectedStance] = useState<'pro' | 'con' | 'neutral'>('neutral');
  const [argument, setArgument] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voteTrends, setVoteTrends] = useState<VoteTrend[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canModerate = hasRole('moderator');
  const isAuthor = user && debate && user.id === debate.author_id;
  const canDelete = isAuthor || canModerate;

  useEffect(() => {
    if (id) {
      fetchDebate();
      fetchStances();
      fetchVoteTrends();
      if (user) fetchUserStance();
    }
  }, [id, user]);

  async function fetchDebate() {
    if (!id) return;

    const { data, error } = await supabase
      .from('debates')
      .select('*, users!debates_author_id_fkey(username), categories(name, color)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching debate:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setDebate(data);
    }
    setLoading(false);
  }

  async function fetchStances() {
    if (!id) return;

    const { data, error } = await supabase
      .from('debate_stances')
      .select('*, users!debate_stances_user_id_fkey(username, avatar_url)')
      .eq('debate_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stances:', error);
      return;
    }

    if (data) {
      const stancesWithVotes = await Promise.all(
        data.map(async (stance) => {
          const { data: votes } = await supabase
            .from('stance_votes')
            .select('vote_value')
            .eq('stance_id', stance.id);

          const vote_score = votes?.reduce((sum, v) => sum + v.vote_value, 0) || 0;

          return {
            ...stance,
            vote_score,
          };
        })
      );

      stancesWithVotes.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
      setStances(stancesWithVotes);
    }
  }

  async function fetchVoteTrends() {
    if (!id) return;

    const { data } = await supabase
      .from('vote_trends')
      .select('*')
      .eq('debate_id', id)
      .order('timestamp', { ascending: true })
      .limit(30);

    if (data) {
      setVoteTrends(data);
    }
  }

  async function fetchUserStance() {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('debate_stances')
      .select('*, users!debate_stances_user_id_fkey(username, avatar_url)')
      .eq('debate_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user stance:', error);
      return;
    }

    if (data) {
      setUserStance(data);
      setSelectedStance(data.stance as 'pro' | 'con' | 'neutral');
      setArgument(data.argument);
    }
  }

  async function handleSubmitStance(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !id) return;
    if (!argument.trim()) return;

    if (userStance && userStance.vote_change_count >= 1 && userStance.stance !== selectedStance) {
      alert('You have already used your one vote change. Your vote and argument stance are now locked.');
      return;
    }

    setSubmitting(true);

    if (userStance) {
      const voteChanged = userStance.stance !== selectedStance;
      const { error } = await supabase
        .from('debate_stances')
        .update({
          stance: selectedStance,
          argument: argument.trim(),
          vote_change_count: voteChanged ? userStance.vote_change_count + 1 : userStance.vote_change_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userStance.id);

      if (!error) {
        fetchStances();
        fetchUserStance();
      }
    } else {
      const { error } = await supabase
        .from('debate_stances')
        .insert({
          debate_id: id,
          user_id: user.id,
          stance: selectedStance,
          argument: argument.trim(),
        });

      if (!error) {
        fetchStances();
        fetchUserStance();
      }
    }

    setSubmitting(false);
  }

  async function handleVoteOnStance(stanceId: string, voteValue: number) {
    if (!user) return;

    const { data: existing } = await supabase
      .from('stance_votes')
      .select('*')
      .eq('stance_id', stanceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (existing.vote_value === voteValue) {
        await supabase
          .from('stance_votes')
          .delete()
          .eq('id', existing.id);
      } else {
        await supabase
          .from('stance_votes')
          .update({ vote_value: voteValue })
          .eq('id', existing.id);
      }
    } else {
      await supabase
        .from('stance_votes')
        .insert({
          stance_id: stanceId,
          user_id: user.id,
          vote_value: voteValue,
        });
    }

    fetchStances();
  }

  async function handleDelete() {
    if (!user || !id) return;

    setDeleting(true);
    const result = await deleteDebate(id, user.id);
    setDeleting(false);

    if (result.success) {
      navigate('/debates');
    } else {
      alert(result.error || 'Failed to delete debate');
      setDeleteModalOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">Debate not found</h2>
        <Link to="/debates" className="text-red-600 hover:text-red-700 font-medium">
          Back to Debates
        </Link>
      </div>
    );
  }

  const proStances = stances.filter(s => s.stance === 'pro');
  const conStances = stances.filter(s => s.stance === 'con');
  const neutralStances = stances.filter(s => s.stance === 'neutral');

  const totalVotes = proStances.length + conStances.length + neutralStances.length;
  const proPercent = totalVotes > 0 ? (proStances.length / totalVotes) * 100 : 33.33;
  const conPercent = totalVotes > 0 ? (conStances.length / totalVotes) * 100 : 33.33;
  const neutralPercent = totalVotes > 0 ? (neutralStances.length / totalVotes) * 100 : 33.33;

  const isVoteLocked = userStance && userStance.vote_change_count >= 1;
  const canChangeVote = userStance && userStance.vote_change_count === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/debates')}
        className="flex items-center gap-2 text-muted-foreground hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Debates
      </button>

      <div className="bg-card rounded-3xl p-8 border border-border">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4 flex-1">
            <Scale className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {debate.categories && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: debate.categories.color }}
                >
                  {debate.categories.name}
                </span>
              )}
              {debate.is_locked && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-3">
              {debate.topic}
            </h1>

            {debate.description && (
              <p className="text-muted-foreground mb-4">
                {debate.description}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              Started by <UserLink userId={debate.author_id} username={debate.users?.username || 'Anonymous'} inline className="font-medium" />
            </p>
            </div>
          </div>
          {canDelete && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
              title="Delete Debate"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>

        {voteTrends.length > 0 && (
          <div className="bg-muted rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Vote Trends Over Time</h3>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                {(() => {
                  const maxCount = Math.max(...voteTrends.flatMap(t => [t.pro_count, t.con_count, t.neutral_count]), 1);
                  const width = 800;
                  const height = 200;
                  const padding = 20;
                  const points = voteTrends.length;
                  const xStep = (width - padding * 2) / Math.max(points - 1, 1);

                  const proPoints = voteTrends.map((t, i) => {
                    const x = padding + i * xStep;
                    const y = height - padding - ((t.pro_count / maxCount) * (height - padding * 2));
                    return `${x},${y}`;
                  }).join(' ');

                  const conPoints = voteTrends.map((t, i) => {
                    const x = padding + i * xStep;
                    const y = height - padding - ((t.con_count / maxCount) * (height - padding * 2));
                    return `${x},${y}`;
                  }).join(' ');

                  const neutralPoints = voteTrends.map((t, i) => {
                    const x = padding + i * xStep;
                    const y = height - padding - ((t.neutral_count / maxCount) * (height - padding * 2));
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline
                        points={proPoints}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polyline
                        points={neutralPoints}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polyline
                        points={conPoints}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-foreground">Pro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-foreground">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-foreground">Con</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-green-600 dark:text-green-400">{proPercent.toFixed(0)}% PRO ({proStances.length})</span>
            <span className="text-blue-600 dark:text-blue-400">{neutralPercent.toFixed(0)}% NEUTRAL ({neutralStances.length})</span>
            <span className="text-red-600 dark:text-red-400">{conPercent.toFixed(0)}% CON ({conStances.length})</span>
          </div>
          <div className="flex h-4 bg-muted rounded-full overflow-hidden">
            <div className="bg-green-500 transition-all" style={{ width: `${proPercent}%` }}></div>
            <div className="bg-blue-500 transition-all" style={{ width: `${neutralPercent}%` }}></div>
            <div className="bg-red-500 transition-all" style={{ width: `${conPercent}%` }}></div>
          </div>
        </div>

        {!debate.is_locked && user && (
          <div className="bg-muted rounded-2xl p-6 mb-6">
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => !isVoteLocked && setSelectedStance('pro')}
                disabled={isVoteLocked && selectedStance !== 'pro'}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all ${
                  selectedStance === 'pro'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : isVoteLocked
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-card text-foreground border-2 border-border hover:border-green-600'
                }`}
              >
                <ThumbsUp className="w-6 h-6 mx-auto mb-2" />
                Vote PRO
              </button>
              <button
                type="button"
                onClick={() => !isVoteLocked && setSelectedStance('neutral')}
                disabled={isVoteLocked && selectedStance !== 'neutral'}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all ${
                  selectedStance === 'neutral'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : isVoteLocked
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-card text-foreground border-2 border-border hover:border-blue-600'
                }`}
              >
                <Minus className="w-6 h-6 mx-auto mb-2" />
                Neutral
              </button>
              <button
                type="button"
                onClick={() => !isVoteLocked && setSelectedStance('con')}
                disabled={isVoteLocked && selectedStance !== 'con'}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all ${
                  selectedStance === 'con'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : isVoteLocked
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-card text-foreground border-2 border-border hover:border-red-600'
                }`}
              >
                <ThumbsDown className="w-6 h-6 mx-auto mb-2" />
                Vote CON
              </button>
            </div>

            {userStance && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800 dark:text-blue-100">
                    <p className="font-medium mb-1">You voted <strong>{userStance.stance.toUpperCase()}</strong>.</p>
                    {isVoteLocked ? (
                      <p className="text-xs">Vote change limit reached (1/1). Your vote and argument stance are locked.</p>
                    ) : canChangeVote ? (
                      <p className="text-xs">You can change your vote ONCE only (0/1 changes used).</p>
                    ) : (
                      <p className="text-xs">You can still edit your argument.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-blue-800 dark:text-blue-100">
                  <p className="font-bold mb-2">Important Debate Rules</p>
                  <ul className="space-y-1 text-xs">
                    <li>• You may submit only ONE argument per debate</li>
                    <li>• Your argument will be placed under your current vote ({selectedStance.toUpperCase()})</li>
                    <li>• You can change your vote (and argument placement) ONCE only</li>
                    <li>• After one vote change, both your vote and argument stance are locked</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitStance}>
              <textarea
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                placeholder="Present your argument..."
                className="w-full px-4 py-3 border border-border rounded-2xl bg-card text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                required
              />

              <button
                type="submit"
                disabled={submitting || !argument.trim()}
                className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-2xl transition-colors"
              >
                {submitting ? 'Submitting...' : userStance ? 'Edit Argument' : 'Submit Stance'}
              </button>
            </form>
          </div>
        )}

        {!user && !debate.is_locked && (
          <div className="bg-muted rounded-2xl p-6 text-center">
            <p className="text-muted-foreground mb-4">Sign in to take a stance in this debate</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
            <ThumbsUp className="w-6 h-6" />
            Pro ({proStances.length})
          </h3>
          {proStances.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 text-center border border-border">
              <p className="text-muted-foreground">No pro arguments yet</p>
            </div>
          ) : (
            proStances.map((stance) => (
              <div key={stance.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      <UserLink userId={stance.user_id} username={stance.users?.username || 'Anonymous'} inline />
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    {stance.vote_score || 0}
                  </div>
                </div>
                <p className="text-foreground text-sm mb-3">{stance.argument}</p>
                {user && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVoteOnStance(stance.id, 1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleVoteOnStance(stance.id, -1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Minus className="w-6 h-6" />
            Neutral ({neutralStances.length})
          </h3>
          {neutralStances.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 text-center border border-border">
              <p className="text-muted-foreground">No neutral arguments yet</p>
            </div>
          ) : (
            neutralStances.map((stance) => (
              <div key={stance.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      <UserLink userId={stance.user_id} username={stance.users?.username || 'Anonymous'} inline />
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    {stance.vote_score || 0}
                  </div>
                </div>
                <p className="text-foreground text-sm mb-3">{stance.argument}</p>
                {user && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVoteOnStance(stance.id, 1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleVoteOnStance(stance.id, -1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <ThumbsDown className="w-6 h-6" />
            Con ({conStances.length})
          </h3>
          {conStances.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 text-center border border-border">
              <p className="text-muted-foreground">No con arguments yet</p>
            </div>
          ) : (
            conStances.map((stance) => (
              <div key={stance.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      <UserLink userId={stance.user_id} username={stance.users?.username || 'Anonymous'} inline />
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    {stance.vote_score || 0}
                  </div>
                </div>
                <p className="text-foreground text-sm mb-3">{stance.argument}</p>
                {user && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVoteOnStance(stance.id, 1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleVoteOnStance(stance.id, -1)}
                      className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Debate"
        message={`Are you sure you want to delete "${debate?.topic}"? This action cannot be undone and will permanently remove this debate and all its arguments.`}
        loading={deleting}
      />
    </div>
  );
}
