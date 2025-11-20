export type UserRole = 'owner' | 'admin' | 'super_moderator' | 'moderator' | 'user';

export type ModerationStatus = 'approved' | 'pending' | 'quarantined' | 'removed';

export type ContentType = 'discussion' | 'comment' | 'debate';

export type ReportReason = 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'off_topic' | 'other';

export type ReportStatus = 'unresolved' | 'in_progress' | 'resolved' | 'dismissed';

export type RestrictionType = 'quarantined' | 'removed' | 'restored';

export type ModerationActionType =
  | 'approve'
  | 'remove'
  | 'quarantine'
  | 'restore'
  | 'resolve_report'
  | 'dismiss_report'
  | 'change_role'
  | 'ban_user'
  | 'unban_user';

export interface Report {
  id: string;
  reporter_id: string;
  content_type: ContentType;
  content_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ContentRestriction {
  id: string;
  content_type: ContentType;
  content_id: string;
  restriction_type: RestrictionType;
  moderator_id: string;
  reason: string | null;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  action_type: ModerationActionType;
  target_type: ContentType | 'report' | 'user';
  target_id: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ModerationMetrics {
  total_users: number;
  total_discussions: number;
  total_comments: number;
  pending_reports: number;
  quarantined_content: number;
  active_moderators: number;
}

export interface ContentWithModeration {
  id: string;
  moderation_status: ModerationStatus;
  report_count: number;
  last_moderation_action: string | null;
  moderated_by: string | null;
}

export interface BulkActionRequest {
  content_type: ContentType;
  content_ids: string[];
  action: 'approve' | 'remove' | 'restore';
  reason?: string;
}

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ content_id: string; error: string }>;
}

export interface RolePermissions {
  canViewReports: boolean;
  canResolveReports: boolean;
  canModerateContent: boolean;
  canManageUsers: boolean;
  canChangeRoles: boolean;
  canViewAuditLogs: boolean;
  canManageSettings: boolean;
  canActOnRole: (targetRole: UserRole) => boolean;
}
