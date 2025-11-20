/*
  # Homepage Control Audit Log

  1. New Tables
    - `homepage_control_audit_log`
      - `id` (uuid, primary key) - Unique identifier
      - `section_id` (text) - The section ID that was modified (or 'bulk_reorder' for bulk operations)
      - `user_id` (uuid, nullable) - Foreign key to users table (who made the change)
      - `action_type` (text) - Type of action performed (e.g., 'section_enabled', 'section_disabled', 'section_updated', 'sections_reordered')
      - `field_changed` (text) - Which field was changed
      - `old_value` (text, nullable) - Previous value before change
      - `new_value` (text, nullable) - New value after change
      - `created_at` (timestamptz) - When the change was made

  2. Security
    - Enable RLS on `homepage_control_audit_log` table
    - Allow admins to view audit logs
    - Only system can insert audit logs (through service functions)
    - No updates or deletes allowed (audit logs are immutable)

  3. Indexes
    - Index on section_id for filtering by section
    - Index on user_id for filtering by user
    - Index on created_at for chronological queries
    - Index on action_type for filtering by action
*/

CREATE TABLE IF NOT EXISTS homepage_control_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_homepage_audit_section ON homepage_control_audit_log(section_id);
CREATE INDEX IF NOT EXISTS idx_homepage_audit_user ON homepage_control_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_homepage_audit_created ON homepage_control_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_audit_action ON homepage_control_audit_log(action_type);

ALTER TABLE homepage_control_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view homepage control audit log"
  ON homepage_control_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'owner', 'super_moderator')
    )
  );

CREATE POLICY "Authenticated users can insert homepage control audit log"
  ON homepage_control_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );