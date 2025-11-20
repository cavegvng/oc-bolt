/*
  # Add Discussion Likes and Last Activity Tracking

  ## Overview
  This migration adds a simple like system for discussions and tracks last activity
  to show recent engagement. This separates discussions (with likes) from debates (with pro/con voting).

  ## New Tables
  
  ### discussion_likes
  Simple thumbs-up likes for discussions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to users
  - `discussion_id` (uuid) - Foreign key to discussions
  - `created_at` (timestamptz) - When the like was created
  - Unique constraint on (user_id, discussion_id) - One like per user per discussion

  ## Modified Tables

  ### discussions
  Added columns:
  - `last_activity_at` (timestamptz) - Timestamp of most recent comment or creation
  - `last_activity_user_id` (uuid) - User who made the last comment (nullable)

  ## Security
  - RLS enabled on discussion_likes table
  - Policies for authenticated users to like/unlike discussions
  - Public read access for like counts

  ## Indexes
  - Index on discussion_id for fast like counting
  - Index on user_id for user activity queries
  - Index on last_activity_at for sorting by recent activity
*/

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  discussion_id uuid REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, discussion_id)
);

-- Add last activity columns to discussions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE discussions ADD COLUMN last_activity_at timestamptz DEFAULT now() NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'last_activity_user_id'
  ) THEN
    ALTER TABLE discussions ADD COLUMN last_activity_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion ON discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user ON discussion_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON discussions(last_activity_at DESC);

-- Enable Row Level Security
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discussion_likes
CREATE POLICY "Anyone can view discussion likes"
  ON discussion_likes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can like discussions"
  ON discussion_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON discussion_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update last_activity_at when comments are added
CREATE OR REPLACE FUNCTION update_discussion_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions
  SET 
    last_activity_at = NEW.created_at,
    last_activity_user_id = NEW.user_id
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_activity_at
DROP TRIGGER IF EXISTS trigger_update_discussion_activity ON comments;
CREATE TRIGGER trigger_update_discussion_activity
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_last_activity();

-- Initialize last_activity_at for existing discussions (set to created_at if no comments)
UPDATE discussions
SET last_activity_at = created_at
WHERE last_activity_at IS NULL OR last_activity_at = created_at;