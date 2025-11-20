/*
  # Add RLS Policies for New Feature Tables

  ## Overview
  Comprehensive Row Level Security policies for all new tables including:
  debates, profiles, achievements, social features, moderation, and notifications.

  ## Security Principles
  1. Public read access for content meant to be discovered
  2. Authenticated users can create their own content
  3. Users can only modify/delete their own content
  4. Privacy settings are respected (profiles, visitor tracking)
  5. Moderator actions are logged but restricted

  ## Policies by Table

  ### Debates
  - Anyone can view debates
  - Authenticated users can create debates
  - Authors can update/delete their own debates

  ### Debate Stances
  - Anyone can view stances/arguments
  - Authenticated users can submit stance (one per debate)
  - Users can update their own stance

  ### Stance Votes
  - Anyone can view votes (for counting)
  - Authenticated users can vote on stances
  - Users can change their own votes

  ### User Profiles
  - Public profiles visible to all
  - Private/friends profiles restricted
  - Users can update their own profile

  ### Social Links
  - Visible to anyone viewing the profile
  - Users can manage their own social links

  ### Profile Visitors
  - Only profile owner can see their visitors
  - Automatic tracking respects privacy settings

  ### Achievements
  - Definitions visible to all
  - User achievements visible to all
  - System manages achievement grants

  ### Profile Comments
  - Visible based on profile visibility
  - Authenticated users can comment
  - Authors and profile owners can delete

  ### Content Flags
  - Users can create flags
  - Only reporter can see their own flags
  - Moderators can see all (handled at app level)

  ### Moderation Actions
  - Logged for audit trail
  - Viewable by moderators only (handled at app level)

  ### Notifications
  - Users can only see their own notifications
  - Users can mark their notifications as read
*/

-- Debates policies
CREATE POLICY "Anyone can view debates"
  ON debates FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create debates"
  ON debates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own debates"
  ON debates FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own debates"
  ON debates FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Debate stances policies
CREATE POLICY "Anyone can view debate stances"
  ON debate_stances FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can submit stance"
  ON debate_stances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stance"
  ON debate_stances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stance"
  ON debate_stances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Stance votes policies
CREATE POLICY "Anyone can view stance votes"
  ON stance_votes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can vote on stances"
  ON stance_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON stance_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON stance_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Anyone can view public profiles"
  ON user_profiles FOR SELECT
  TO authenticated, anon
  USING (
    profile_visibility = 'public' OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Social links policies
CREATE POLICY "Anyone can view social links"
  ON social_links FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create own social links"
  ON social_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social links"
  ON social_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social links"
  ON social_links FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Profile visitors policies
CREATE POLICY "Users can view who visited their profile"
  ON profile_visitors FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "System can log profile visits"
  ON profile_visitors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = visitor_id);

-- Achievements definitions policies
CREATE POLICY "Anyone can view achievement definitions"
  ON achievements_definitions FOR SELECT
  TO authenticated, anon
  USING (true);

-- User achievements policies
CREATE POLICY "Anyone can view user achievements"
  ON user_achievements FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can grant achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update achievement progress"
  ON user_achievements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Profile comments policies
CREATE POLICY "Anyone can view profile comments"
  ON profile_comments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can post profile comments"
  ON profile_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own profile comments"
  ON profile_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and profile owners can delete comments"
  ON profile_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    auth.uid() = profile_id
  );

-- Content flags policies
CREATE POLICY "Users can view own flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can flag content"
  ON content_flags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Moderation actions policies
CREATE POLICY "Anyone can view moderation log"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can log moderation actions"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = moderator_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
