/*
  # Add Multiple Categories Support to Discussions

  1. Schema Changes
    - Add `category_ids` column (text array) to discussions table
    - Migrate existing single category_id values to category_ids array
    - Keep category_id column temporarily for backward compatibility
    - Add index on category_ids for efficient filtering

  2. Data Migration
    - Copy all existing category_id values into category_ids as single-element arrays
    - Handle null category_id values appropriately

  3. Notes
    - This migration maintains backward compatibility
    - Future migration can remove category_id column once frontend is updated
    - GIN index on category_ids enables fast array containment queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'category_ids'
  ) THEN
    ALTER TABLE discussions ADD COLUMN category_ids text[];
  END IF;
END $$;

UPDATE discussions
SET category_ids = ARRAY[category_id]
WHERE category_id IS NOT NULL AND category_ids IS NULL;

UPDATE discussions
SET category_ids = ARRAY[]::text[]
WHERE category_id IS NULL AND category_ids IS NULL;

CREATE INDEX IF NOT EXISTS idx_discussions_category_ids ON discussions USING GIN (category_ids);
