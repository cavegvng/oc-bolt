/*
  # Add Discussion Control Features for Moderation
  
  ## Summary
  This migration adds comprehensive moderation controls for discussions, including promoted content 
  management with expiration dates, featured discussion tracking, and a complete audit log system 
  for accountability.
  
  ## New Fields Added to discussions Table
  
  ### Promoted Content Fields
  - `is_promoted` (boolean) - Marks discussion as promoted/paid advertising content
  - `promoted_start_date` (timestamptz) - When promotion campaign began
  - `promoted_end_date` (timestamptz, nullable) - Optional expiration date for automatic promotion end
  - `promoted_by` (uuid) - Foreign key to users table, tracks which admin enabled promotion
  
  ### Featured Content Fields
  - `featured_at` (timestamptz, nullable) - Timestamp when discussion was featured
  - `featured_by` (uuid, nullable) - Foreign key to users table, tracks which admin featured the discussion
  
  ## New Tables
  
  ### discussion_control_audit_log
  Complete audit trail for all discussion control changes
  - `id` (uuid, primary key)
  - `discussion_id` (uuid) - Foreign key to discussions
  - `user_id` (uuid) - Foreign key to users, the admin who made the change
  - `action_type` (text) - Type of action: 'featured', 'promoted', 'pinned', 'unfeatured', 'unpromoted', 'unpinned'
  - `field_changed` (text) - Which field was modified
  - `old_value` (text) - Previous value (JSON string)
  - `new_value` (text) - New value (JSON string)
  - `created_at` (timestamptz) - When the change occurred
  
  ## Indexes
  - Index on promoted_end_date for efficient expiration queries
  - Index on featured_at for sorting featured content
  - Indexes on audit log for filtering and searching
  
  ## Security
  - RLS enabled on audit_log table
  - Only admins and super_moderators can read audit logs
  - System can insert audit log entries
  
  ## Important Notes
  1. promoted_end_date is nullable to allow open-ended promotions
  2. Audit log stores values as text (JSON) for flexibility
  3. Automatic expiration will be handled by scheduled function (separate implementation)
  4. All moderation actions must log to audit table for accountability
*/

-- Add new fields to discussions table
DO $$
BEGIN
  -- Promoted content fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'is_promoted'
  ) THEN
    ALTER TABLE discussions ADD COLUMN is_promoted boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'promoted_start_date'
  ) THEN
    ALTER TABLE discussions ADD COLUMN promoted_start_date timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'promoted_end_date'
  ) THEN
    ALTER TABLE discussions ADD COLUMN promoted_end_date timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'promoted_by'
  ) THEN
    ALTER TABLE discussions ADD COLUMN promoted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Featured content fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'featured_at'
  ) THEN
    ALTER TABLE discussions ADD COLUMN featured_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'featured_by'
  ) THEN
    ALTER TABLE discussions ADD COLUMN featured_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create discussion_control_audit_log table
CREATE TABLE IF NOT EXISTS discussion_control_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('featured', 'unfeatured', 'promoted', 'unpromoted', 'pinned', 'unpinned', 'promotion_expired')),
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussions_promoted ON discussions(is_promoted) WHERE is_promoted = true;
CREATE INDEX IF NOT EXISTS idx_discussions_promoted_end_date ON discussions(promoted_end_date) WHERE promoted_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discussions_featured_at ON discussions(featured_at DESC) WHERE featured_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discussions_promoted_by ON discussions(promoted_by);
CREATE INDEX IF NOT EXISTS idx_discussions_featured_by ON discussions(featured_by);

CREATE INDEX IF NOT EXISTS idx_audit_log_discussion ON discussion_control_audit_log(discussion_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON discussion_control_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON discussion_control_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON discussion_control_audit_log(action_type);

-- Enable RLS on audit log table
ALTER TABLE discussion_control_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view audit logs" ON discussion_control_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON discussion_control_audit_log;

-- Only admins, super_moderators, and owners can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON discussion_control_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_moderator', 'owner')
    )
  );

-- Authenticated users can insert audit logs (application will validate permissions)
CREATE POLICY "System can insert audit logs"
  ON discussion_control_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);