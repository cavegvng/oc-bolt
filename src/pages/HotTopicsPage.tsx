import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { Flame, TrendingUp, MessageSquare, Eye, Clock } from 'lucide-react';
import { UserLink } from '../components/UserLink';

type HotTopic = Database['public']['Tables']['hot_topics']['Row'] & {
  discussions: (Database['public']['Tables']['discussions']['Row'] & {
    users: {
      username: string;
    } | null;
    categories: {
      name: string;
      color: string;
    } | null;
  }) | null;
};

export function HotTopicsPage() {
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotTopics();
  }, []);

  async function fetchHotTopics() {
    setLoading(true);

    const { data } = await supabase
      .from('hot_topics')
      .select(`
        *,
        discussions (
          *,
          users (username),
          categories (name, color)
        )
      `)
      .order('trending_score', { ascending: false })
      .limit(20);

    if (data) {
      setHotTopics(data);
    }

    setLoading(false);
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

  function getTemperatureColor(temp: number): string {
    if (temp >= 80) return 'text-red-600';
    if (temp >= 60) return 'text-orange-600';
    if (temp >= 40) return 'text-yellow-600';
    return 'text-blue-600';
  }

  function getTemperatureLabel(temp: number): string {
    if (temp >= 80) return 'Blazing Hot';
    if (temp >= 60) return 'Heating Up';
    if (temp >= 40) return 'Warming';
    return 'Cool';
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Flame className="w-10 h-10 text-orange-500" />
          <h1 className="text-4xl font-bold text-foreground">
            Hot Topics
          </h1>
          <Flame className="w-10 h-10 text-orange-500" />
        </div>
        <p className="text-xl text-muted-foreground">
          The discussions everyone's talking about right now
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-3xl p-6 animate-pulse"
            >
              <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : hotTopics.length === 0 ? (
        <div className="bg-card rounded-3xl p-12 text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No hot topics yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Be the first to start a trending conversation!
          </p>
          <Link
            to="/discussions/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-2xl transition-colors"
          >
            Start a Discussion
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {hotTopics.map((topic, index) => {
            const discussion = topic.discussions;
            if (!discussion) return null;

            return (
              <Link
                key={topic.id}
                to={`/discussions/${discussion.id}`}
                className="block bg-card rounded-3xl p-6 hover:shadow-lg transition-shadow border border-border relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <Flame className={`w-full h-full ${getTemperatureColor(topic.temperature)}`} />
                </div>

                <div className="flex items-start gap-6 relative">
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <div className="text-3xl font-bold text-muted-foreground dark:text-gray-600">
                      #{index + 1}
                    </div>
                    <div className={`flex items-center gap-1 ${getTemperatureColor(topic.temperature)}`}>
                      <Flame className="w-5 h-5" />
                      <span className="font-bold">{Math.round(topic.temperature)}</span>
                    </div>
                    <span className={`text-xs font-medium ${getTemperatureColor(topic.temperature)}`}>
                      {getTemperatureLabel(topic.temperature)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {discussion.categories && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: discussion.categories.color }}
                        >
                          {discussion.categories.name}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        Trending
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                      {discussion.title}
                    </h3>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {discussion.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UserLink userId={discussion.author_id} username={discussion.users?.username || 'Anonymous'} inline className="font-medium" />
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeAgo(discussion.created_at)}
                      </div>

                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {discussion.view_count}
                      </div>

                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {Math.round(topic.trending_score)} trending score
                      </div>

                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {Math.round(topic.comment_velocity)}/hr
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-3xl p-8 border border-orange-200 dark:border-orange-800">
        <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          How Hot Topics Work
        </h3>
        <div className="space-y-2 text-foreground">
          <p>
            <span className="font-medium">Trending Score:</span> Based on views, votes, and engagement velocity
          </p>
          <p>
            <span className="font-medium">Comment Velocity:</span> Comments per hour - shows how fast the conversation is moving
          </p>
          <p>
            <span className="font-medium">Temperature:</span> A real-time measure of how heated the discussion is
          </p>
        </div>
      </div>
    </div>
  );
}
