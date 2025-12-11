import { Link } from 'react-router-dom';
import { Eye, MessageSquare, Youtube, Twitter, Instagram } from 'lucide-react';
import { Database } from '../lib/database.types';
import { ActivityIndicator } from './ActivityIndicator';
import { DiscussionBadges } from './DiscussionBadges';
import { UserLink } from './UserLink';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

interface DiscussionCardProps {
  discussion: Discussion;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function DiscussionCard({ discussion, size = 'small', className = '' }: DiscussionCardProps) {
  const isHot = (discussion.recent_comment_count || 0) >= 3;
  const hasThumbnail = !!discussion.thumbnail_url;
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      if (!discussion.category_ids || discussion.category_ids.length === 0) {
        return;
      }

      const { data } = await supabase
        .from('categories')
        .select('id, name, color, icon')
        .in('id', discussion.category_ids);

      if (data) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, [discussion.category_ids]);

  const sizeClasses = {
    small: 'md:col-span-1 md:row-span-1',
    medium: 'md:col-span-1 md:row-span-2',
    large: 'md:col-span-2 md:row-span-2',
  };

  const contentClasses = {
    small: 'p-5',
    medium: 'p-6',
    large: 'p-8',
  };

  const titleClasses = {
    small: 'text-lg line-clamp-2',
    medium: 'text-xl line-clamp-3',
    large: 'text-2xl line-clamp-4',
  };

  const descriptionClasses = {
    small: 'line-clamp-2',
    medium: 'line-clamp-4',
    large: 'line-clamp-6',
  };

  const getPlatformIcon = () => {
    if (discussion.youtube_url) return <Youtube className="w-4 h-4" />;
    if (discussion.twitter_url) return <Twitter className="w-4 h-4" />;
    if (discussion.instagram_url) return <Instagram className="w-4 h-4" />;
    return null;
  };

  const getCategoryGradient = () => {
    if (categories.length > 0) {
      return categories[0].color;
    }
    if (discussion.categories?.color) {
      return discussion.categories.color;
    }
    return '#6366f1';
  };

  return (
    <Link
      to={`/discussions/${discussion.id}`}
      className={`group relative rounded-3xl border border-border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: hasThumbnail ? 'transparent' : 'var(--card)',
      }}
    >
      {hasThumbnail && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: `url(${discussion.thumbnail_url})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90" />
        </>
      )}

      {!hasThumbnail && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${getCategoryGradient()} 0%, transparent 100%)`,
          }}
        />
      )}

      <div className={`relative h-full flex flex-col ${contentClasses[size]} z-10`}>
        <ActivityIndicator active={isHot} className="absolute top-4 left-4 z-10" />

        <div className="absolute top-4 right-4 z-10">
          <DiscussionBadges
            isFeatured={discussion.is_featured}
            isPromoted={discussion.is_promoted}
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg border border-white/20"
                style={{ backgroundColor: category.color }}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            ))}
          </div>
        )}

        <h3
          className={`font-bold mb-3 ${titleClasses[size]} ${
            hasThumbnail ? 'text-white drop-shadow-lg' : 'text-foreground'
          }`}
        >
          {discussion.title}
        </h3>

        <p
          className={`text-sm mb-4 flex-grow ${descriptionClasses[size]} ${
            hasThumbnail ? 'text-gray-100 drop-shadow-md' : 'text-muted-foreground'
          }`}
        >
          {discussion.description}
        </p>

        <div className="mt-auto space-y-3">
          <div
            className={`flex items-center gap-4 text-sm ${
              hasThumbnail ? 'text-gray-200' : 'text-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{discussion.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>{discussion.comment_count || 0}</span>
            </div>
            {hasThumbnail && getPlatformIcon() && (
              <div className="flex items-center gap-1.5 ml-auto">
                {getPlatformIcon()}
              </div>
            )}
          </div>

          {discussion.users && (
            <div className={hasThumbnail ? 'text-gray-100' : 'text-muted-foreground'}>
              <UserLink
                userId={discussion.author_id}
                username={discussion.users.username}
                showAvatar={true}
                avatarUrl={discussion.users.avatar_url}
                className={hasThumbnail ? 'text-gray-100' : ''}
              />
            </div>
          )}
        </div>
      </div>

      <div
        className={`absolute inset-0 transition-opacity pointer-events-none ${
          hasThumbnail
            ? 'bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100'
            : 'bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100'
        }`}
      />
    </Link>
  );
}
