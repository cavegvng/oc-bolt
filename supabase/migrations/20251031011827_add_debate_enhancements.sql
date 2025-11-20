/*
  # Add Debate System Enhancements
  
  ## Changes Made
  
  1. Debates Table Enhancements
    - Add `is_featured` field (boolean) to mark debates for prominent display
    - Add `view_count` field (integer) to track debate visibility
    
  2. Debate Stances Table Enhancements
    - Add `vote_change_count` field (integer) to track how many times a user has changed their vote
    - Default is 0, maximum allowed is 1 (enforced in application logic)
    
  3. New Table: vote_trends
    - Track historical voting data for debates over time
    - Fields: id, debate_id, timestamp, pro_count, con_count, neutral_count
    - Enables Vote Trends Over Time chart display
    
  4. Security
    - Enable RLS on vote_trends table
    - Add appropriate policies for read access
    - Maintain existing RLS on debates and debate_stances tables
*/

-- Add missing fields to debates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debates' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE debates ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debates' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE debates ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add vote_change_count to debate_stances table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debate_stances' AND column_name = 'vote_change_count'
  ) THEN
    ALTER TABLE debate_stances ADD COLUMN vote_change_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create vote_trends table for historical voting data
CREATE TABLE IF NOT EXISTS vote_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now() NOT NULL,
  pro_count integer DEFAULT 0 NOT NULL,
  con_count integer DEFAULT 0 NOT NULL,
  neutral_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index on debate_id and timestamp for efficient querying
CREATE INDEX IF NOT EXISTS vote_trends_debate_id_idx ON vote_trends(debate_id);
CREATE INDEX IF NOT EXISTS vote_trends_timestamp_idx ON vote_trends(timestamp DESC);

-- Enable RLS on vote_trends
ALTER TABLE vote_trends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view vote trends" ON vote_trends;
DROP POLICY IF EXISTS "System can insert vote trends" ON vote_trends;

-- Allow anyone to read vote trends (public data for charts)
CREATE POLICY "Anyone can view vote trends"
  ON vote_trends
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system/backend can insert vote trend snapshots
CREATE POLICY "System can insert vote trends"
  ON vote_trends
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Add unique constraint to prevent duplicate user stances per debate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'debate_stances_user_debate_unique'
  ) THEN
    ALTER TABLE debate_stances
    ADD CONSTRAINT debate_stances_user_debate_unique
    UNIQUE (debate_id, user_id);
  END IF;
END $$;