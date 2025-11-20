/*
  # Fix NULL Moderation Status Values

  1. Changes
    - Update all discussions with NULL moderation_status to 'approved'
    - Update all comments with NULL moderation_status to 'approved'
    - Update all debates with NULL moderation_status to 'approved'
    - Add NOT NULL constraints to prevent future NULL values
  
  2. Purpose
    - Ensures all content has a valid moderation status
    - Prevents "Discussion not found" errors caused by NULL status values
    - Maintains data consistency across the application
  
  3. Notes
    - This migration sets existing NULL values to 'approved' (the default state)
    - After this migration, all new content will be required to have a moderation_status
    - The default value is already set to 'approved' in previous migrations
*/

-- Update all NULL moderation_status to 'approved' for discussions
UPDATE discussions 
SET moderation_status = 'approved'
WHERE moderation_status IS NULL;

-- Update all NULL moderation_status to 'approved' for comments
UPDATE comments 
SET moderation_status = 'approved'
WHERE moderation_status IS NULL;

-- Update all NULL moderation_status to 'approved' for debates
UPDATE debates 
SET moderation_status = 'approved'
WHERE moderation_status IS NULL;

-- Add NOT NULL constraints to ensure data consistency going forward
ALTER TABLE discussions 
ALTER COLUMN moderation_status SET NOT NULL;

ALTER TABLE comments 
ALTER COLUMN moderation_status SET NOT NULL;

ALTER TABLE debates 
ALTER COLUMN moderation_status SET NOT NULL;
