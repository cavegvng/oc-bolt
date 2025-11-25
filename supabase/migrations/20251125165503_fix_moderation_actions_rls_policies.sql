/*
  # Fix Moderation Actions RLS Policies

  1. Problem
    - Current policies allow ANY authenticated user to view moderation logs
    - Current policies allow ANY authenticated user to insert moderation actions
    - This is a security issue - only moderators should have access

  2. Solution
    - Drop existing overly-permissive policies
    - Create restrictive policies that ONLY allow moderators+ to:
      - View moderation actions (SELECT)
      - Create moderation action logs (INSERT)
    - Moderator roles: 'moderator', 'super_moderator', 'admin', 'owner'

  3. Security
    - SELECT: Only users with moderator+ role can view audit logs
    - INSERT: Only users with moderator+ role can create audit entries
    - UPDATE/DELETE: Not allowed (audit logs are immutable)
*/

-- Drop existing overly-permissive policies
DROP POLICY IF EXISTS "Anyone can view moderation log" ON moderation_actions;
DROP POLICY IF EXISTS "System can log moderation actions" ON moderation_actions;

-- Create restrictive SELECT policy - only moderators+ can view audit logs
CREATE POLICY "Moderators can view moderation actions"
  ON moderation_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  );

-- Create restrictive INSERT policy - only moderators+ can log actions
CREATE POLICY "Moderators can log moderation actions"
  ON moderation_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin', 'super_moderator', 'moderator')
    )
  );
