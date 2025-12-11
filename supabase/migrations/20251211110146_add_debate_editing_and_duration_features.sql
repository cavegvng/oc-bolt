/*
  # Add Debate Editing and Time Duration Features

  ## Overview
  This migration adds functionality for editing debates and managing debate durations with automatic conclusion.

  ## New Columns Added to debates table
  
  1. **end_date** (timestamptz, nullable)
     - Specifies when the debate should automatically conclude
     - Used to trigger auto-lock functionality
     - Indexed for efficient queries of expiring debates
  
  2. **duration_days** (integer, nullable)
     - Stores the original duration set when creating/editing debate
     - Used for display and recalculation purposes
  
  3. **last_edited_by** (uuid, nullable)
     - Foreign key to auth.users
     - Tracks which user made the last edit
     - NULL if debate has never been edited
  
  4. **last_edited_at** (timestamptz, nullable)
     - Timestamp of the last edit
     - NULL if debate has never been edited
  
  ## Database Functions
  
  1. **check_and_lock_concluded_debates()**
     - Automatically locks debates that have reached their end_date
     - Sets is_locked to true for expired debates
     - Returns count of debates that were locked
  
  ## Indexes
  
  - Index on end_date for efficient queries of expiring debates
  
  ## Security
  
  - RLS policies remain unchanged
  - Permission checks for editing handled at application level
  - Audit logging integration via moderation_actions table
*/

-- Add new columns to debates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debates' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE debates ADD COLUMN end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debates' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE debates ADD COLUMN duration_days integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debates' AND column_name = 'last_edited_by'
  ) THEN
    ALTER TABLE debates ADD COLUMN last_edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debates' AND column_name = 'last_edited_at'
  ) THEN
    ALTER TABLE debates ADD COLUMN last_edited_at timestamptz;
  END IF;
END $$;

-- Create index on end_date for efficient queries
CREATE INDEX IF NOT EXISTS idx_debates_end_date ON debates(end_date) WHERE end_date IS NOT NULL;

-- Function to automatically lock concluded debates
CREATE OR REPLACE FUNCTION check_and_lock_concluded_debates()
RETURNS integer AS $$
DECLARE
  locked_count integer;
BEGIN
  -- Update debates that have reached their end_date and are not yet locked
  UPDATE debates
  SET is_locked = true
  WHERE end_date IS NOT NULL
    AND end_date <= now()
    AND is_locked = false;
  
  GET DIAGNOSTICS locked_count = ROW_COUNT;
  
  RETURN locked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_and_lock_concluded_debates() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_lock_concluded_debates() TO anon;
