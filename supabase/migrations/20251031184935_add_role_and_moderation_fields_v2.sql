/*
  # Add Role Hierarchy and Moderation System

  1. Schema Changes
    - Add role field to users table with 4-tier hierarchy
    - Add moderation fields to discussions, comments, and debates tables
    - Add report tracking fields to content tables
    
  2. New Tables
    - reports table for user-submitted content flags
    - content_restrictions table for tracking moderation history
    
  3. Moderation Fields
    - moderation_status: tracks content state through moderation lifecycle
    - report_count: enables auto-quarantine at threshold
    - last_moderation_action: timestamp of last moderator action
    - moderated_by: tracks which moderator took action
    
  4. Security
    - Enable RLS on all new tables
    - Add policies for role-based access control
*/

-- Add role field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Add constraint after column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('owner', 'admin', 'super_moderator', 'moderator', 'user'));
  END IF;
END $$;

-- Add moderation fields to discussions table
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'active';
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS report_count integer DEFAULT 0;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS last_moderation_action timestamptz;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'discussions_moderation_status_check'
  ) THEN
    ALTER TABLE discussions ADD CONSTRAINT discussions_moderation_status_check 
      CHECK (moderation_status IN ('active', 'pending', 'quarantined', 'approved', 'removed'));
  END IF;
END $$;

-- Add moderation fields to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'active';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS report_count integer DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS last_moderation_action timestamptz;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'comments_moderation_status_check'
  ) THEN
    ALTER TABLE comments ADD CONSTRAINT comments_moderation_status_check 
      CHECK (moderation_status IN ('active', 'pending', 'quarantined', 'approved', 'removed'));
  END IF;
END $$;

-- Add moderation fields to debates table
ALTER TABLE debates ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'active';
ALTER TABLE debates ADD COLUMN IF NOT EXISTS report_count integer DEFAULT 0;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS last_moderation_action timestamptz;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'debates_moderation_status_check'
  ) THEN
    ALTER TABLE debates ADD CONSTRAINT debates_moderation_status_check 
      CHECK (moderation_status IN ('active', 'pending', 'quarantined', 'approved', 'removed'));
  END IF;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id),
  content_type text NOT NULL CHECK (content_type IN ('discussion', 'comment', 'debate')),
  content_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'misinformation', 'inappropriate', 'off_topic', 'other')),
  description text,
  status text DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'in_progress', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create content_restrictions table
CREATE TABLE IF NOT EXISTS content_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('discussion', 'comment', 'debate')),
  content_id uuid NOT NULL,
  restriction_type text NOT NULL CHECK (restriction_type IN ('quarantined', 'removed', 'restored')),
  moderator_id uuid NOT NULL REFERENCES users(id),
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_restrictions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_discussions_moderation_status ON discussions(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_debates_moderation_status ON debates(moderation_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- RLS Policies for reports table
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Moderators can view all reports" ON reports;
CREATE POLICY "Moderators can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Moderators can update reports" ON reports;
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  );

-- RLS Policies for content_restrictions table
DROP POLICY IF EXISTS "Moderators can create restrictions" ON content_restrictions;
CREATE POLICY "Moderators can create restrictions"
  ON content_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Moderators can view restrictions" ON content_restrictions;
CREATE POLICY "Moderators can view restrictions"
  ON content_restrictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  );

-- Function to auto-quarantine content when report count reaches threshold
CREATE OR REPLACE FUNCTION auto_quarantine_content()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'unresolved' THEN
    IF NEW.content_type = 'discussion' THEN
      UPDATE discussions
      SET report_count = report_count + 1,
          moderation_status = CASE
            WHEN report_count + 1 >= 5 THEN 'quarantined'
            ELSE moderation_status
          END,
          last_moderation_action = CASE
            WHEN report_count + 1 >= 5 THEN now()
            ELSE last_moderation_action
          END
      WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'comment' THEN
      UPDATE comments
      SET report_count = report_count + 1,
          moderation_status = CASE
            WHEN report_count + 1 >= 5 THEN 'quarantined'
            ELSE moderation_status
          END,
          last_moderation_action = CASE
            WHEN report_count + 1 >= 5 THEN now()
            ELSE last_moderation_action
          END
      WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'debate' THEN
      UPDATE debates
      SET report_count = report_count + 1,
          moderation_status = CASE
            WHEN report_count + 1 >= 5 THEN 'quarantined'
            ELSE moderation_status
          END,
          last_moderation_action = CASE
            WHEN report_count + 1 >= 5 THEN now()
            ELSE last_moderation_action
          END
      WHERE id = NEW.content_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-quarantine
DROP TRIGGER IF EXISTS trigger_auto_quarantine ON reports;
CREATE TRIGGER trigger_auto_quarantine
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_quarantine_content();