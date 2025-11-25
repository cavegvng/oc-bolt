/*
  # Fix Moderation Actions INSERT Policy

  1. Problem
    - No INSERT policy exists on moderation_actions table
    - RLS blocks all inserts by default
    - Audit logs cannot be created even though code is calling logModerationAction()

  2. Solution
    - Create INSERT policy for moderators+
    - Replace old "anyone" SELECT policy with moderator-only policy
    - Ensure only moderators/admins can create and view audit logs

  3. Security
    - INSERT: Only moderators+ can create audit logs
    - SELECT: Only moderators+ can view audit logs
    - Audit logs remain immutable (no UPDATE/DELETE policies)
*/

-- Allow moderators and above to insert into moderation_actions
CREATE POLICY "Moderators can insert moderation actions"
  ON moderation_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('moderator', 'super_moderator', 'admin', 'owner')
    )
  );

-- Tighten the SELECT policy to moderators+ only (replace the old "anyone" one)
DROP POLICY IF EXISTS "Anyone can view moderation log" ON moderation_actions;
DROP POLICY IF EXISTS "Moderators can view moderation logs" ON moderation_actions;
DROP POLICY IF EXISTS "Moderators can view moderation actions" ON moderation_actions;

CREATE POLICY "Moderators can view moderation logs"
  ON moderation_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('moderator', 'super_moderator', 'admin', 'owner')
    )
  );
