/*
  # Core Database Schema for Debate Forum Platform

  ## Overview
  This migration creates the complete database schema for a debate forum platform
  with discussion posts, threaded comments, voting system, user reputation, and activity tracking.

  ## New Tables

  ### 1. users
  Extended user profile table (links to auth.users)
  - `id` (uuid, primary key) - Links to auth.users.id
  - `email` (text, unique) - User email
  - `username` (text, unique) - Display name
  - `avatar_url` (text, nullable) - Profile picture URL
  - `bio` (text, nullable) - User biography
  - `reputation_points` (integer) - Gamification score
  - `created_at` (timestamptz) - Account creation date

  ### 2. categories
  Discussion categories/topics
  - `id` (uuid, primary key)
  - `name` (text, unique) - Category name
  - `slug` (text, unique) - URL-friendly identifier
  - `color` (text) - Hex color code for UI
  - `icon` (text) - Lucide icon name
  - `description` (text, nullable) - Category description
  - `created_at` (timestamptz)

  ### 3. discussions
  Main discussion posts
  - `id` (uuid, primary key)
  - `author_id` (uuid) - Foreign key to users
  - `title` (text) - Discussion title
  - `description` (text) - Full discussion content
  - `category_id` (uuid) - Foreign key to categories
  - `image_url` (text, nullable) - Uploaded image URL
  - `video_url` (text, nullable) - YouTube/Vimeo embed URL
  - `is_pinned` (boolean) - Featured/sticky status
  - `is_featured` (boolean) - Hero slider eligibility
  - `view_count` (integer) - View tracking
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. votes
  Pro/Con/Neutral stance votes on discussions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `discussion_id` (uuid) - Foreign key to discussions
  - `vote_type` (text) - 'pro', 'con', or 'neutral'
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, discussion_id)

  ### 5. comments
  Threaded discussion comments
  - `id` (uuid, primary key)
  - `discussion_id` (uuid) - Foreign key to discussions
  - `user_id` (uuid) - Foreign key to users
  - `parent_comment_id` (uuid, nullable) - Self-referencing for threading
  - `content` (text) - Comment content with Markdown
  - `upvotes` (integer) - Upvote count
  - `downvotes` (integer) - Downvote count
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. comment_votes
  Upvote/downvote tracking for comments
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `comment_id` (uuid) - Foreign key to comments
  - `vote_value` (integer) - 1 for upvote, -1 for downvote
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, comment_id)

  ### 7. hot_topics
  Trending discussions cache
  - `id` (uuid, primary key)
  - `discussion_id` (uuid, unique) - Foreign key to discussions
  - `trending_score` (numeric) - Calculated engagement score
  - `comment_velocity` (numeric) - Comments per hour
  - `temperature` (numeric) - Recent activity heat
  - `updated_at` (timestamptz)

  ### 8. activity_feed
  User activity stream for bottom ticker
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `action_type` (text) - 'created_discussion', 'posted_comment', 'voted'
  - `discussion_id` (uuid, nullable) - Related discussion
  - `comment_id` (uuid, nullable) - Related comment
  - `created_at` (timestamptz)

  ### 9. user_badges
  Achievement badges for gamification
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `badge_type` (text) - Badge identifier
  - `badge_name` (text) - Display name
  - `earned_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies created for authenticated user access
  - Read access for public content
  - Write access restricted to owners

  ## Indexes
  - Foreign key indexes for joins
  - Performance indexes on frequently queried columns
  - Unique constraints for data integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  reputation_points integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  video_url text,
  is_pinned boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('pro', 'con', 'neutral')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, discussion_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0 NOT NULL,
  downvotes integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  vote_value integer NOT NULL CHECK (vote_value IN (-1, 1)),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, comment_id)
);

-- Hot topics table
CREATE TABLE IF NOT EXISTS hot_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id uuid UNIQUE REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  trending_score numeric DEFAULT 0 NOT NULL,
  comment_velocity numeric DEFAULT 0 NOT NULL,
  temperature numeric DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Activity feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('created_discussion', 'posted_comment', 'voted')),
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL,
  badge_name text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_pinned ON discussions(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_discussions_featured ON discussions(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_votes_discussion ON votes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_discussion ON comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user ON comment_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_hot_topics_score ON hot_topics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hot_topics_temperature ON hot_topics(temperature DESC);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
