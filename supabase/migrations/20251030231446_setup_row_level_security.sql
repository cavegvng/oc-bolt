/*
  # Row Level Security Policies

  ## Security Model
  
  This migration implements comprehensive Row Level Security (RLS) policies for all tables.
  The security model follows these principles:
  
  1. **Public Read Access**: Categories, discussions, comments, and hot topics are publicly readable
  2. **Authenticated Write Access**: Only authenticated users can create content
  3. **Owner-Only Modifications**: Users can only edit/delete their own content
  4. **Protected User Data**: Users can only modify their own profile
  5. **System Tables**: Hot topics are read-only for users (updated by backend functions)

  ## Policies by Table

  ### users
  - Anyone can view user profiles (public data)
  - Users can view their own complete profile
  - Users can update only their own profile
  - User creation handled by auth trigger

  ### categories
  - Public read access (everyone can browse categories)
  - No public write access (admin-only via backend)

  ### discussions
  - Public read access (all discussions visible to everyone)
  - Authenticated users can create discussions
  - Authors can update their own discussions
  - Authors can delete their own discussions

  ### votes
  - Users can view their own votes
  - Users can view all votes (for aggregation/stats)
  - Authenticated users can insert votes
  - Users can update/delete their own votes

  ### comments
  - Public read access (all comments visible)
  - Authenticated users can create comments
  - Authors can update their own comments
  - Authors can delete their own comments

  ### comment_votes
  - Users can view their own comment votes
  - Authenticated users can insert comment votes
  - Users can update/delete their own votes

  ### hot_topics
  - Public read access (trending data visible to all)
  - No public write access (system-managed)

  ### activity_feed
  - Public read access (activity visible to all)
  - Authenticated users can create activity entries
  - No delete access (permanent record)

  ### user_badges
  - Public read access (badges visible on profiles)
  - No public write access (system-managed)
*/

-- Users policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Discussions policies
CREATE POLICY "Discussions are viewable by everyone"
  ON discussions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON discussions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own discussions"
  ON discussions FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own discussions"
  ON discussions FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment votes policies
CREATE POLICY "Comment votes are viewable by everyone"
  ON comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comment votes"
  ON comment_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment votes"
  ON comment_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment votes"
  ON comment_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hot topics policies
CREATE POLICY "Hot topics are viewable by everyone"
  ON hot_topics FOR SELECT
  USING (true);

-- Activity feed policies
CREATE POLICY "Activity feed is viewable by everyone"
  ON activity_feed FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create activity entries"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- Create trigger function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_value = 1 THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.vote_value = -1 THEN
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_value = 1 THEN
      UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSIF OLD.vote_value = -1 THEN
      UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
    IF NEW.vote_value = 1 THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.vote_value = -1 THEN
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_value = 1 THEN
      UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSIF OLD.vote_value = -1 THEN
      UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for comment votes
DROP TRIGGER IF EXISTS comment_votes_trigger ON comment_votes;
CREATE TRIGGER comment_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_votes();

-- Create function to update discussion updated_at timestamp
CREATE OR REPLACE FUNCTION update_discussion_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for discussion updates
DROP TRIGGER IF EXISTS update_discussion_updated_at ON discussions;
CREATE TRIGGER update_discussion_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_timestamp();

-- Create function to update comment updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for comment updates
DROP TRIGGER IF EXISTS update_comment_updated_at ON comments;
CREATE TRIGGER update_comment_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_timestamp();
