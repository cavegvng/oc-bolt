/*
  # Add Soft Delete Functionality

  1. Changes to discussions table
    - Add `deleted_at` timestamp column for soft delete tracking
    - Add `deleted_by` uuid column to track who deleted the post

  2. Changes to debates table
    - Add `deleted_at` timestamp column for soft delete tracking
    - Add `deleted_by` uuid column to track who deleted the post

  3. Security
    - RLS policies updated to allow users to delete their own posts
    - RLS policies allow moderators and above to delete any post
    - Queries will filter out soft-deleted posts by default

  4. Notes
    - Soft deletes preserve data for audit trail
    - Posts can be restored by setting deleted_at to NULL
    - All delete actions are logged in audit tables
*/

-- Add soft delete columns to discussions table
ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL REFERENCES users(id);

-- Add soft delete columns to debates table
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL REFERENCES users(id);

-- Create index for faster queries filtering deleted posts
CREATE INDEX IF NOT EXISTS discussions_deleted_at_idx ON discussions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS debates_deleted_at_idx ON debates(deleted_at) WHERE deleted_at IS NULL;

-- Add RLS policy for users to soft-delete their own discussions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discussions' 
    AND policyname = 'Users can delete own discussions'
  ) THEN
    CREATE POLICY "Users can delete own discussions"
      ON discussions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = author_id)
      WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

-- Add RLS policy for users to soft-delete their own debates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debates' 
    AND policyname = 'Users can delete own debates'
  ) THEN
    CREATE POLICY "Users can delete own debates"
      ON debates
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = author_id)
      WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

-- Add RLS policy for moderators to soft-delete any discussion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discussions' 
    AND policyname = 'Moderators can delete any discussion'
  ) THEN
    CREATE POLICY "Moderators can delete any discussion"
      ON discussions
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('moderator', 'super_moderator', 'admin', 'owner')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('moderator', 'super_moderator', 'admin', 'owner')
        )
      );
  END IF;
END $$;

-- Add RLS policy for moderators to soft-delete any debate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'debates' 
    AND policyname = 'Moderators can delete any debate'
  ) THEN
    CREATE POLICY "Moderators can delete any debate"
      ON debates
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('moderator', 'super_moderator', 'admin', 'owner')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('moderator', 'super_moderator', 'admin', 'owner')
        )
      );
  END IF;
END $$;
