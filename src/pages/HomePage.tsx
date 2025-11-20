import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { TrendingUp, MessageSquare, Users, Flame, ArrowRight, Vote, Scale, Palette, Leaf, LucideIcon } from 'lucide-react';
import { DiscussionCard } from '../components/DiscussionCard';
import { getHomepageSections } from '../services/homepage-controls-service';

type Discussion = Database['public']['Tables']['discussions']['Row'] & {
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
  categories: {
    name: string;
    color: string;
  } | null;
  comment_count?: number;
  recent_comment_count?: number;
};

type Category = Database['public']['Tables']['categories']['Row'];

const categoryIcons: Record<string, LucideIcon> = {
  'Vote': Vote,
  'Users': Users,
  'Scale': Scale,
  'Palette': Palette,
  'TrendingUp': TrendingUp,
  'Leaf': Leaf,
};

export function HomePage() {
  const [featuredDiscussions, setFeaturedDiscussions] = useState<Discussion[]>([]);
  const [trendingDiscussions, setTrendingDiscussions] = useState<Discussion[]>([]);
  const [allDiscussions, setAllDiscussions] = useState<Discussion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    totalDiscussions: 0,
    totalUsers: 0,
    totalComments: 0,
  });
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);

  useEffect(() => {
    fetchHomeData();
    fetchSectionVisibility();
  }, []);

  async function fetchSectionVisibility() {
    try {
      const sections = await getHomepageSections();
      const sectionMap = sections.reduce((acc, section) => {
        acc[section.section_key] = section.is_visible;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleSections(sectionMap);

      const orderedKeys = sections
        .sort((a, b) => a.display_order - b.display_order)
        .map(section => section.section_key);
      setSectionOrder(orderedKeys);
    } catch (error) {
      console.error('Error fetching section visibility:', error);
      setVisibleSections({
        hero: true,
        stats: true,
        featured: true,
        trending: true,
        discover: true,
        categories: true,
      });
      setSectionOrder(['hero', 'stats', 'featured', 'trending', 'discover', 'categories']);
    }
  }

  async function fetchHomeData() {
    const [featured, trending, all, cats, discussionCount, userCount, commentCount] = await Promise.all([
      supabase
        .from('discussions')
        .select('*, users!discussions_author_id_fkey(username, avatar_url), categories(name, color)')
        .eq('is_featured', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('discussions')
        .select('*, users!discussions_author_id_fkey(username, avatar_url), categories(name, color)')
        .eq('moderation_status', 'approved')
        .order('view_count', { ascending: false })
        .limit(5),
      supabase
        .from('discussions')
        .select('*, users!discussions_author_id_fkey(username, avatar_url), categories(name, color)')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('categories')
        .select('*')
        .order('name'),
      supabase
        .from('discussions')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true }),
    ]);

    if (featured.data) setFeaturedDiscussions(featured.data);
    if (trending.data) setTrendingDiscussions(trending.data);
    if (cats.data) setCategories(cats.data);

    if (all.data) {
      const discussionsWithCounts = await Promise.all(
        all.data.map(async (discussion) => {
          const [totalComments, recentComments] = await Promise.all([
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id),
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id)
              .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()),
          ]);
          return {
            ...discussion,
            comment_count: totalComments.count || 0,
            recent_comment_count: recentComments.count || 0,
          };
        })
      );

      const sorted = discussionsWithCounts.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAllDiscussions(sorted);
    }

    setStats({
      totalDiscussions: discussionCount.count || 0,
      totalUsers: userCount.count || 0,
      totalComments: commentCount.count || 0,
    });
  }

  const renderSection = (sectionKey: string) => {
    if (!visibleSections[sectionKey]) return null;

    switch (sectionKey) {
      case 'hero':
        return (
          <section key="hero" className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Welcome to <span className="text-red-600">Overly</span>Concerned
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Because everyone's an expert online.
        </p>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          A space for the passionately opinionated. Debate. Discuss. Overthink.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/discussions"
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-2xl transition-colors inline-flex items-center gap-2"
          >
            Browse Discussions
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/hot-topics"
            className="px-8 py-3 bg-card hover:bg-accent text-foreground font-medium rounded-2xl transition-colors border border-border inline-flex items-center gap-2"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            Hot Topics
          </Link>
        </div>
      </section>
        );

      case 'stats':
        return (
          <section key="stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-red-600" />
            <h3 className="text-3xl font-bold text-foreground">
              {stats.totalDiscussions}
            </h3>
          </div>
          <p className="text-muted-foreground">Active Discussions</p>
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h3 className="text-3xl font-bold text-foreground">
              {stats.totalUsers}
            </h3>
          </div>
          <p className="text-muted-foreground">Community Members</p>
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h3 className="text-3xl font-bold text-foreground">
              {stats.totalComments}
            </h3>
          </div>
          <p className="text-muted-foreground">Comments Posted</p>
        </div>
      </section>
        );

      case 'featured':
        if (featuredDiscussions.length === 0) return null;
        return (
          <section key="featured">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Featured Discussions
            </h2>
            <Link
              to="/discussions"
              className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDiscussions.map((discussion) => (
              <Link
                key={discussion.id}
                to={`/discussions/${discussion.id}`}
                className="bg-card rounded-3xl p-6 hover:shadow-lg transition-shadow border border-border"
              >
                {discussion.categories && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium text-white mb-3 inline-block"
                    style={{ backgroundColor: discussion.categories.color }}
                  >
                    {discussion.categories.name}
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                  {discussion.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {discussion.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  by {discussion.users?.username || 'Anonymous'}
                </p>
              </Link>
            ))}
          </div>
        </section>
        );

      case 'trending':
        if (trendingDiscussions.length === 0) return null;
        return (
          <section key="trending">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-red-600" />
              Trending Now
            </h2>
          </div>

          <div className="bg-card rounded-3xl border border-border divide-y divide-border">
            {trendingDiscussions.map((discussion) => (
              <Link
                key={discussion.id}
                to={`/discussions/${discussion.id}`}
                className="block p-6 hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1 line-clamp-1">
                      {discussion.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {discussion.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {discussion.categories && (
                        <span>{discussion.categories.name}</span>
                      )}
                      <span>•</span>
                      <span>{discussion.view_count} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        );

      case 'discover':
        if (allDiscussions.length === 0) return null;
        return (
          <section key="discover">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Discover Discussions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-auto">
            {allDiscussions.map((discussion) => {
              const size = discussion.is_featured
                ? 'large'
                : discussion.is_promoted
                ? 'medium'
                : 'small';

              return (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  size={size}
                />
              );
            })}
          </div>
        </section>
        );

      case 'categories':
        if (categories.length === 0) return null;
        return (
          <section key="categories">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Explore Topics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.icon];
              return (
                <Link
                  key={category.id}
                  to={`/discussions?category=${category.slug}`}
                  className="bg-card rounded-3xl p-6 hover:shadow-lg transition-all border border-border text-center group"
                >
                  <div className="mb-3 flex items-center justify-center">
                    {IconComponent && (
                      <IconComponent
                        className="w-12 h-12 group-hover:scale-110 transition-transform"
                        style={{ color: category.color }}
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-sm">
                    {category.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      {sectionOrder.map(sectionKey => renderSection(sectionKey))}
    </div>
  );
}
