/*
  # Simplify Moderation Status System

  ## Overview
  This migration simplifies the moderation status system by:
  - Removing the redundant 'active' status
  - Keeping only: 'approved', 'pending', 'quarantined', 'removed'
  - Setting all existing discussions to 'approved' by default
  - Making 'approved' the default status for new discussions

  ## Changes

  1. Data Migration
     - Update all discussions with 'active' or null status to 'approved'

  2. Schema Changes
     - Drop existing CHECK constraints
     - Create moderation_status enum with simplified values
     - Update discussions table to use new enum
     - Update comments table to use new enum
     - Update debates table to use new enum
     - Set default value to 'approved' for all tables

  3. Triggers
     - Add trigger to automatically set status to 'approved' if not specified

  ## Security
     - No changes to RLS policies (they will continue to work with new status values)
*/

-- Step 1: Drop CHECK constraints that prevent data migration
ALTER TABLE discussions DROP CONSTRAINT IF EXISTS discussions_moderation_status_check;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_moderation_status_check;
ALTER TABLE debates DROP CONSTRAINT IF EXISTS debates_moderation_status_check;

-- Step 2: Update all existing data while columns are still TEXT
-- Convert 'active' to 'approved', handle nulls
UPDATE discussions
SET moderation_status = 'approved'
WHERE moderation_status = 'active' OR moderation_status IS NULL;

UPDATE comments
SET moderation_status = 'approved'
WHERE moderation_status = 'active' OR moderation_status IS NULL;

UPDATE debates
SET moderation_status = 'approved'
WHERE moderation_status = 'active' OR moderation_status IS NULL;

-- Step 3: Create new enum type with simplified values
CREATE TYPE moderation_status AS ENUM ('approved', 'pending', 'quarantined', 'removed');

-- Step 4: Drop existing defaults before type conversion
ALTER TABLE discussions ALTER COLUMN moderation_status DROP DEFAULT;
ALTER TABLE comments ALTER COLUMN moderation_status DROP DEFAULT;
ALTER TABLE debates ALTER COLUMN moderation_status DROP DEFAULT;

-- Step 5: Convert TEXT columns to use the new enum type
-- All values are now either 'approved', 'pending', 'quarantined', or 'removed'
ALTER TABLE discussions
  ALTER COLUMN moderation_status TYPE moderation_status
  USING moderation_status::moderation_status;

ALTER TABLE comments
  ALTER COLUMN moderation_status TYPE moderation_status
  USING moderation_status::moderation_status;

ALTER TABLE debates
  ALTER COLUMN moderation_status TYPE moderation_status
  USING moderation_status::moderation_status;

-- Step 6: Set default values to 'approved'
ALTER TABLE discussions
  ALTER COLUMN moderation_status SET DEFAULT 'approved'::moderation_status;

ALTER TABLE comments
  ALTER COLUMN moderation_status SET DEFAULT 'approved'::moderation_status;

ALTER TABLE debates
  ALTER COLUMN moderation_status SET DEFAULT 'approved'::moderation_status;

-- Step 7: Create trigger function to ensure new content is approved by default
CREATE OR REPLACE FUNCTION set_default_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status IS NULL THEN
    NEW.moderation_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Add triggers to all relevant tables
DROP TRIGGER IF EXISTS discussions_default_status ON discussions;
CREATE TRIGGER discussions_default_status
  BEFORE INSERT ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION set_default_moderation_status();

DROP TRIGGER IF EXISTS comments_default_status ON comments;
CREATE TRIGGER comments_default_status
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_default_moderation_status();

DROP TRIGGER IF EXISTS debates_default_status ON debates;
CREATE TRIGGER debates_default_status
  BEFORE INSERT ON debates
  FOR EACH ROW
  EXECUTE FUNCTION set_default_moderation_status();
