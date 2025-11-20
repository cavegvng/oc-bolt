import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Scale, ThumbsUp, ThumbsDown, Minus, Clock, Eye, Filter, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/use-permissions';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { bulkDeleteDebates } from '../services/delete-service';

type Debate = Database['public']['Tables']['debates']['Row'] & {
  users: {
    username: string;
  } | null;
  categories: {
    name: string;
    color: string;
  } | null;
  stance_counts?: {
    pro: number;
    con: number;
    neutral: number;
  };
};

type Category = Database['public']['Tables']['categories']['Row'];

export function DebatesPage() {
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'active'>('recent');
  const [loading, setLoading] = useState(true);
  const [selectedDebates, setSelectedDebates] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const canModerate = hasRole('moderator');

  useEffect(() => {
    fetchCategories();
    fetchDebates();
  }, [selectedCategory, sortBy]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  }

  async function fetchDebates() {
    setLoading(true);

    let query = supabase
      .from('debates')
      .select(`
        *,
        users!debates_author_id_fkey (username),
        categories (name, color)
      `)
      .is('deleted_at', null);

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
      query = query.order('view_count', { ascending: false });
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('Error fetching debates:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const debatesWithCounts = await Promise.all(
        data.map(async (debate) => {
          const { data: stances } = await supabase
            .from('debate_stances')
            .select('stance')
            .eq('debate_id', debate.id);

          const stance_counts = {
            pro: stances?.filter(s => s.stance === 'pro').length || 0,
            con: stances?.filter(s => s.stance === 'con').length || 0,
            neutral: stances?.filter(s => s.stance === 'neutral').length || 0,
          };

          return {
            ...debate,
            stance_counts,
          };
        })
      );

      setDebates(debatesWithCounts);
    }

    setLoading(false);
  }

  function toggleSelectDebate(id: string) {
    const newSelected = new Set(selectedDebates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDebates(newSelected);
  }

  function toggleSelectAll() {
    if (selectedDebates.size === debates.length && debates.length > 0) {
      setSelectedDebates(new Set());
    } else {
      setSelectedDebates(new Set(debates.map(d => d.id)));
    }
  }

  async function handleBulkDelete() {
    if (!user || selectedDebates.size === 0) return;

    setBulkLoading(true);
    const result = await bulkDeleteDebates(Array.from(selectedDebates), user.id);
    setBulkLoading(false);

    if (result.success) {
      setSelectedDebates(new Set());
      setDeleteModalOpen(false);
      fetchDebates();
    } else {
      alert(result.error || 'Failed to delete debates');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Scale className="w-8 h-8 text-red-600" />
            Debates
          </h1>
          <p className="text-muted-foreground mt-1">
            Choose your side. Defend your position.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canModerate && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl text-foreground hover:bg-accent transition-colors"
              title={selectedDebates.size === debates.length && debates.length > 0 ? 'Deselect All' : 'Select All'}
            >
              {selectedDebates.size === debates.length && debates.length > 0 ? (
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
              <option value="active">Most Active</option>
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
              : 'bg-card text-foreground hover:bg-accent border border-border'
          }`}
        >
          All Topics
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors border ${
              selectedCategory === category.id
                ? 'text-white border-transparent'
                : 'bg-card text-foreground hover:bg-accent border-border'
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
        <div className="flex items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-border border-t-red-600 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : debates.length === 0 ? (
        <div className="bg-card rounded-3xl p-12 text-center border border-border">
          <Scale className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No debates yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Be the first to start a debate in this category!
          </p>
          <Link
            to="/debates/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-2xl transition-colors"
          >
            Start a Debate
          </Link>
        </div>
      ) : (
        <>
          {debates.find(d => d.is_featured) && (
            <div className="mb-8">
              {(() => {
                const featuredDebate = debates.find(d => d.is_featured);
                if (!featuredDebate) return null;

                const totalVotes = (featuredDebate.stance_counts?.pro || 0) + (featuredDebate.stance_counts?.con || 0) + (featuredDebate.stance_counts?.neutral || 0);
                const proPercent = totalVotes > 0 ? ((featuredDebate.stance_counts?.pro || 0) / totalVotes) * 100 : 0;
                const conPercent = totalVotes > 0 ? ((featuredDebate.stance_counts?.con || 0) / totalVotes) * 100 : 0;
                const neutralPercent = totalVotes > 0 ? ((featuredDebate.stance_counts?.neutral || 0) / totalVotes) * 100 : 0;

                return (
                  <Link
                    to={`/debates/${featuredDebate.id}`}
                    className="block bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 hover:shadow-2xl transition-all border-2 border-red-500"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold text-white uppercase tracking-wide">
                        Featured Debate
                      </span>
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        Active
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4 line-clamp-2">
                      {featuredDebate.topic}
                    </h2>

                    {featuredDebate.description && (
                      <p className="text-white/90 mb-6 line-clamp-2 text-lg">
                        {featuredDebate.description}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-white/90">
                        <span className="font-semibold">{proPercent.toFixed(0)}% PRO ({featuredDebate.stance_counts?.pro || 0})</span>
                        <span className="font-semibold">{neutralPercent.toFixed(0)}% NEUTRAL ({featuredDebate.stance_counts?.neutral || 0})</span>
                        <span className="font-semibold">{conPercent.toFixed(0)}% CON ({featuredDebate.stance_counts?.con || 0})</span>
                      </div>
                      <div className="flex h-3 bg-white/20 rounded-full overflow-hidden">
                        <div className="bg-green-500" style={{ width: `${proPercent}%` }}></div>
                        <div className="bg-blue-500" style={{ width: `${neutralPercent}%` }}></div>
                        <div className="bg-red-400" style={{ width: `${conPercent}%` }}></div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span className="font-medium">Started by {featuredDebate.users?.username || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{totalVotes} total votes</span>
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debates.filter(d => !d.is_featured).map((debate) => {
              const totalVotes = (debate.stance_counts?.pro || 0) + (debate.stance_counts?.con || 0) + (debate.stance_counts?.neutral || 0);
              const proPercent = totalVotes > 0 ? ((debate.stance_counts?.pro || 0) / totalVotes) * 100 : 33.33;
              const conPercent = totalVotes > 0 ? ((debate.stance_counts?.con || 0) / totalVotes) * 100 : 33.33;
              const neutralPercent = totalVotes > 0 ? ((debate.stance_counts?.neutral || 0) / totalVotes) * 100 : 33.33;

              return (
                <div key={debate.id} className={`bg-card rounded-3xl p-6 transition-all border ${
                  selectedDebates.has(debate.id)
                    ? 'border-red-500 shadow-md'
                    : 'border-border'
                }`}>
                  {canModerate && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSelectDebate(debate.id);
                      }}
                      className="float-right text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedDebates.has(debate.id) ? (
                        <CheckSquare className="w-5 h-5 text-red-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <Link
                    to={`/debates/${debate.id}`}
                    className="block hover:opacity-80 transition-opacity"
                  >
                  <div className="flex items-center gap-2 mb-3">
                    {debate.categories && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: debate.categories.color }}
                      >
                        {debate.categories.name}
                      </span>
                    )}
                    {debate.is_locked ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Locked
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-3 min-h-[4.5rem]">
                    {debate.topic}
                  </h3>

                  {debate.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {debate.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-green-600 dark:text-green-400">{proPercent.toFixed(0)}% PRO</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{neutralPercent.toFixed(0)}% NEUTRAL</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{conPercent.toFixed(0)}% CON</span>
                    </div>
                    <div className="flex h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="bg-green-500 transition-all" style={{ width: `${proPercent}%` }}></div>
                      <div className="bg-blue-500 transition-all" style={{ width: `${neutralPercent}%` }}></div>
                      <div className="bg-red-500 transition-all" style={{ width: `${conPercent}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-green-600 dark:text-green-400">{debate.stance_counts?.pro || 0}</span>
                      <span className="text-blue-600 dark:text-blue-400">{debate.stance_counts?.neutral || 0}</span>
                      <span className="text-red-600 dark:text-red-400">{debate.stance_counts?.con || 0}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {debate.users?.username || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5" />
                        {totalVotes} total votes
                      </div>
                    </div>
                  </div>
                </Link>
                </div>
              );
            })}
          </div>
        </>
      )}

      {canModerate && selectedDebates.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-3xl shadow-2xl p-4 flex items-center gap-4 z-50">
          <span className="text-foreground font-medium">
            {selectedDebates.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-2xl font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedDebates(new Set())}
              className="px-4 py-2 bg-accent hover:bg-accent/70 text-foreground rounded-2xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Debates"
        message={`Are you sure you want to delete ${selectedDebates.size} debate${selectedDebates.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        loading={bulkLoading}
      />
    </div>
  );
}
