/*
  # Fix Moderation Actions CHECK Constraint

  1. Problem
    - Database CHECK constraint only allows: 'delete', 'ban', 'pin', 'feature', 'lock', 'warn', 'edit'
    - Application tries to insert: 'approve', 'remove', 'quarantine', 'restore', 'change_role', 'resolve_report', 'dismiss_report'
    - INSERT operations fail silently due to constraint violations
    - Audit logs cannot be created for most moderation actions

  2. Solution
    - Drop old CHECK constraint
    - Create new CHECK constraint with all action types the application uses
    - Align database schema with TypeScript ModerationActionType

  3. New Allowed Action Types
    - Content moderation: 'approve', 'remove', 'quarantine', 'restore'
    - Content promotion: 'feature', 'unfeature', 'pin', 'unpin'
    - Content control: 'lock', 'unlock', 'edit', 'delete'
    - User management: 'change_role', 'ban', 'unban', 'warn'
    - Report handling: 'resolve_report', 'dismiss_report'

  4. Security
    - No changes to RLS policies
    - Only updating validation constraint
*/

ALTER TABLE moderation_actions 
DROP CONSTRAINT IF EXISTS moderation_actions_action_type_check;

ALTER TABLE moderation_actions
ADD CONSTRAINT moderation_actions_action_type_check
CHECK (action_type IN (
  'approve',
  'remove', 
  'quarantine',
  'restore',
  'feature',
  'unfeature',
  'pin',
  'unpin',
  'lock',
  'unlock',
  'edit',
  'delete',
  'change_role',
  'ban',
  'unban',
  'warn',
  'resolve_report',
  'dismiss_report'
));
