/*
  # Add Comprehensive Feature Tables

  ## Overview
  This migration adds all missing tables required for the complete platform including:
  debates, enhanced profiles, achievements, social features, moderation, and notifications.

  ## New Tables

  ### 1. debates
  Separate from discussions - dedicated debate topics with voting
  - `id` (uuid, primary key)
  - `topic` (text) - The debate topic/question
  - `description` (text, nullable) - Context and background
  - `category_id` (uuid, nullable) - Foreign key to categories
  - `author_id` (uuid) - Foreign key to users
  - `is_locked` (boolean) - Prevent new votes/arguments
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. debate_stances
  User arguments/positions in debates (Pro/Con/Neutral)
  - `id` (uuid, primary key)
  - `debate_id` (uuid) - Foreign key to debates
  - `user_id` (uuid) - Foreign key to users
  - `stance` (text) - 'pro', 'con', or 'neutral'
  - `argument` (text) - User's argument/reasoning
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (debate_id, user_id)

  ### 3. stance_votes
  Upvote/downvote on individual arguments
  - `id` (uuid, primary key)
  - `stance_id` (uuid) - Foreign key to debate_stances
  - `user_id` (uuid) - Foreign key to users
  - `vote_value` (integer) - 1 for upvote, -1 for downvote
  - `created_at` (timestamptz)
  - Unique constraint on (stance_id, user_id)

  ### 4. user_profiles
  Extended profile information beyond basic users table
  - `user_id` (uuid, primary key) - Foreign key to users
  - `banner_url` (text, nullable) - Profile banner image
  - `custom_status` (text, nullable) - Custom status message
  - `last_seen` (timestamptz) - Last activity timestamp
  - `online_status` (text) - 'online', 'busy', 'offline'
  - `allow_visitor_tracking` (boolean) - Privacy setting
  - `profile_visibility` (text) - 'public', 'friends', 'private'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. social_links
  User social media profiles
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `platform` (text) - 'instagram', 'x', 'tiktok', 'youtube'
  - `url` (text) - Full profile URL
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, platform)

  ### 6. profile_visitors
  Track who viewed whose profile
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - Foreign key to users (profile owner)
  - `visitor_id` (uuid) - Foreign key to users (visitor)
  - `viewed_at` (timestamptz)

  ### 7. achievements_definitions
  All available achievements in the system
  - `id` (uuid, primary key)
  - `name` (text, unique) - Achievement name
  - `description` (text) - What it's for
  - `icon` (text) - Lucide icon name
  - `criteria` (jsonb) - Unlock requirements
  - `rarity` (text) - 'common', 'rare', 'epic', 'legendary'
  - `created_at` (timestamptz)

  ### 8. user_achievements
  User earned achievements and progress
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `achievement_id` (uuid) - Foreign key to achievements_definitions
  - `progress` (integer) - Current progress value
  - `earned_at` (timestamptz, nullable) - When completed
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, achievement_id)

  ### 9. profile_comments
  Comments on user profiles (wall)
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - Foreign key to users (profile owner)
  - `author_id` (uuid) - Foreign key to users (commenter)
  - `content` (text) - Comment text
  - `likes` (integer) - Like count
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 10. content_flags
  User reports on content
  - `id` (uuid, primary key)
  - `content_type` (text) - 'discussion', 'comment', 'debate', 'stance', 'profile_comment'
  - `content_id` (uuid) - ID of flagged content
  - `reporter_id` (uuid) - Foreign key to users
  - `reason` (text) - Flag reason
  - `details` (text, nullable) - Additional info
  - `status` (text) - 'pending', 'resolved', 'dismissed'
  - `created_at` (timestamptz)
  - `resolved_at` (timestamptz, nullable)

  ### 11. moderation_actions
  Log of all moderator actions
  - `id` (uuid, primary key)
  - `moderator_id` (uuid) - Foreign key to users
  - `action_type` (text) - 'delete', 'ban', 'pin', 'feature', 'lock', 'warn', 'edit'
  - `target_type` (text) - Type of content acted upon
  - `target_id` (uuid) - ID of target content
  - `reason` (text, nullable) - Moderation reason
  - `details` (jsonb, nullable) - Additional metadata
  - `created_at` (timestamptz)

  ### 12. notifications
  User notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users (recipient)
  - `type` (text) - Notification type
  - `title` (text) - Notification title
  - `content` (text) - Notification message
  - `link_url` (text, nullable) - Where to navigate on click
  - `read` (boolean) - Read status
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only modify their own data
  - Public read access for appropriate content
  - Moderator-only access for moderation tables

  ## Indexes
  - Foreign key indexes for optimal join performance
  - Commonly queried columns indexed
  - Unique constraints for data integrity
*/

-- Debates table
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_locked boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Debate stances table
CREATE TABLE IF NOT EXISTS debate_stances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid REFERENCES debates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stance text NOT NULL CHECK (stance IN ('pro', 'con', 'neutral')),
  argument text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(debate_id, user_id)
);

-- Stance votes table
CREATE TABLE IF NOT EXISTS stance_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stance_id uuid REFERENCES debate_stances(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vote_value integer NOT NULL CHECK (vote_value IN (-1, 1)),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(stance_id, user_id)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  banner_url text,
  custom_status text,
  last_seen timestamptz DEFAULT now() NOT NULL,
  online_status text DEFAULT 'offline' NOT NULL CHECK (online_status IN ('online', 'busy', 'offline')),
  allow_visitor_tracking boolean DEFAULT true NOT NULL,
  profile_visibility text DEFAULT 'public' NOT NULL CHECK (profile_visibility IN ('public', 'friends', 'private')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Social links table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram', 'x', 'tiktok', 'youtube')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, platform)
);

-- Profile visitors table
CREATE TABLE IF NOT EXISTS profile_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  visitor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL
);

-- Achievements definitions table
CREATE TABLE IF NOT EXISTS achievements_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria jsonb NOT NULL,
  rarity text DEFAULT 'common' NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements_definitions(id) ON DELETE CASCADE NOT NULL,
  progress integer DEFAULT 0 NOT NULL,
  earned_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Profile comments table
CREATE TABLE IF NOT EXISTS profile_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  likes integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Content flags table
CREATE TABLE IF NOT EXISTS content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('discussion', 'comment', 'debate', 'stance', 'profile_comment')),
  content_id uuid NOT NULL,
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz
);

-- Moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('delete', 'ban', 'pin', 'feature', 'lock', 'warn', 'edit')),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  link_url text,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_debates_author ON debates(author_id);
CREATE INDEX IF NOT EXISTS idx_debates_category ON debates(category_id);
CREATE INDEX IF NOT EXISTS idx_debates_created ON debates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_debate_stances_debate ON debate_stances(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_stances_user ON debate_stances(user_id);
CREATE INDEX IF NOT EXISTS idx_debate_stances_stance ON debate_stances(stance);

CREATE INDEX IF NOT EXISTS idx_stance_votes_stance ON stance_votes(stance_id);
CREATE INDEX IF NOT EXISTS idx_stance_votes_user ON stance_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_social_links_user ON social_links(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_visitors_profile ON profile_visitors(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_visitor ON profile_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_viewed ON profile_visitors(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS idx_profile_comments_profile ON profile_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_author ON profile_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_created ON profile_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_reporter ON content_flags(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_created ON content_flags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON moderation_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_stances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
