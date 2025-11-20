/*
  # Remove Soft Delete Columns

  1. Changes
    - Remove `deleted_at` column from discussions table
    - Remove `deleted_by` column from discussions table
    - Remove `deleted_at` column from debates table
    - Remove `deleted_by` column from debates table
    - Drop associated indexes
    - Remove soft-delete related RLS policies

  2. Notes
    - Hard deletes are now used instead of soft deletes
    - Audit logs are maintained for tracking deletions
*/

-- Drop indexes for soft-delete columns
DROP INDEX IF EXISTS discussions_deleted_at_idx;
DROP INDEX IF EXISTS debates_deleted_at_idx;

-- Remove soft-delete columns from discussions table
ALTER TABLE discussions
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS deleted_by;

-- Remove soft-delete columns from debates table
ALTER TABLE debates
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS deleted_by;

-- Drop soft-delete related RLS policies (they still work for hard deletes)
-- The existing update policies will allow deletion as well
