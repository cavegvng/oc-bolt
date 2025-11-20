import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { ContentType, ModerationStatus, ModerationActionType } from '../types/moderation';

type ModerationAction = Database['public']['Tables']['moderation_actions']['Row'];
type ContentRestriction = Database['public']['Tables']['content_restrictions']['Row'];

export async function getContentByModerationStatus(
  contentType: ContentType,
  status: ModerationStatus,
  limit = 50,
  offset = 0
) {
  let query = supabase
    .from(contentType === 'discussion' ? 'discussions' : contentType === 'debate' ? 'debates' : 'comments')
    .select('*, author:users!author_id(username, avatar_url)', { count: 'exact' })
    .eq('moderation_status', status)
    .order('last_moderation_action', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
}

export async function getAllQuarantinedContent(limit = 50, offset = 0) {
  const [discussions, comments, debates] = await Promise.all([
    supabase
      .from('discussions')
      .select('*, author:users!author_id(username, avatar_url)')
      .eq('moderation_status', 'quarantined')
      .order('last_moderation_action', { ascending: false })
      .limit(limit),
    supabase
      .from('comments')
      .select('*, user:users!user_id(username, avatar_url)')
      .eq('moderation_status', 'quarantined')
      .order('last_moderation_action', { ascending: false })
      .limit(limit),
    supabase
      .from('debates')
      .select('*, author:users!author_id(username, avatar_url)')
      .eq('moderation_status', 'quarantined')
      .order('last_moderation_action', { ascending: false })
      .limit(limit),
  ]);

  if (discussions.error) throw discussions.error;
  if (comments.error) throw comments.error;
  if (debates.error) throw debates.error;

  return {
    discussions: discussions.data || [],
    comments: comments.data || [],
    debates: debates.data || [],
  };
}

export async function updateContentModerationStatus(
  contentType: ContentType,
  contentId: string,
  status: ModerationStatus,
  moderatorId: string,
  reason?: string
) {
  const tableName = contentType === 'discussion' ? 'discussions' : contentType === 'debate' ? 'debates' : 'comments';

  const { data, error } = await supabase
    .from(tableName)
    .update({
      moderation_status: status,
      moderated_by: moderatorId,
      last_moderation_action: new Date().toISOString(),
    })
    .eq('id', contentId)
    .select()
    .single();

  if (error) throw error;

  await logContentRestriction(contentType, contentId, status, moderatorId, reason);

  return data;
}

export async function approveContent(
  contentType: ContentType,
  contentId: string,
  moderatorId: string
) {
  return updateContentModerationStatus(contentType, contentId, 'approved', moderatorId, 'Content approved after review');
}

export async function removeContent(
  contentType: ContentType,
  contentId: string,
  moderatorId: string,
  reason: string
) {
  return updateContentModerationStatus(contentType, contentId, 'removed', moderatorId, reason);
}

export async function restoreContent(
  contentType: ContentType,
  contentId: string,
  moderatorId: string
) {
  return updateContentModerationStatus(contentType, contentId, 'approved', moderatorId, 'Content restored');
}

export async function bulkApproveContent(
  contentType: ContentType,
  contentIds: string[],
  moderatorId: string
) {
  const tableName = contentType === 'discussion' ? 'discussions' : contentType === 'debate' ? 'debates' : 'comments';

  const { data, error } = await supabase
    .from(tableName)
    .update({
      moderation_status: 'approved',
      moderated_by: moderatorId,
      last_moderation_action: new Date().toISOString(),
    })
    .in('id', contentIds)
    .select();

  if (error) throw error;

  await Promise.all(
    contentIds.map(id => logContentRestriction(contentType, id, 'approved' as ModerationStatus, moderatorId, 'Bulk approved'))
  );

  return data;
}

export async function bulkRemoveContent(
  contentType: ContentType,
  contentIds: string[],
  moderatorId: string,
  reason: string
) {
  const tableName = contentType === 'discussion' ? 'discussions' : contentType === 'debate' ? 'debates' : 'comments';

  const { data, error } = await supabase
    .from(tableName)
    .update({
      moderation_status: 'removed',
      moderated_by: moderatorId,
      last_moderation_action: new Date().toISOString(),
    })
    .in('id', contentIds)
    .select();

  if (error) throw error;

  await Promise.all(
    contentIds.map(id => logContentRestriction(contentType, id, 'removed' as ModerationStatus, moderatorId, reason))
  );

  return data;
}

export async function bulkRestoreContent(
  contentType: ContentType,
  contentIds: string[],
  moderatorId: string
) {
  const tableName = contentType === 'discussion' ? 'discussions' : contentType === 'debate' ? 'debates' : 'comments';

  const { data, error } = await supabase
    .from(tableName)
    .update({
      moderation_status: 'approved',
      moderated_by: moderatorId,
      last_moderation_action: new Date().toISOString(),
    })
    .in('id', contentIds)
    .select();

  if (error) throw error;

  await Promise.all(
    contentIds.map(id => logContentRestriction(contentType, id, 'restored' as ModerationStatus, moderatorId, 'Bulk restored'))
  );

  return data;
}

async function logContentRestriction(
  contentType: ContentType,
  contentId: string,
  status: ModerationStatus,
  moderatorId: string,
  reason?: string
) {
  if (status === 'quarantined' || status === 'removed' || status === 'approved') {
    const restrictionType = status === 'approved' ? 'restored' : status === 'quarantined' ? 'quarantined' : 'removed';

    await supabase.from('content_restrictions').insert({
      content_type: contentType,
      content_id: contentId,
      restriction_type: restrictionType,
      moderator_id: moderatorId,
      reason: reason || null,
    });
  }
}

export async function logModerationAction(
  moderatorId: string,
  actionType: ModerationActionType,
  targetType: ContentType | 'report' | 'user',
  targetId: string,
  reason?: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: moderatorId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      reason: reason || null,
      details: metadata || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getModerationActions(limit = 50, offset = 0) {
  const { data, error, count } = await supabase
    .from('moderation_actions')
    .select('*, moderator:users!moderator_id(username, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

export async function getModerationActionsByModerator(moderatorId: string, limit = 50) {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select('*')
    .eq('moderator_id', moderatorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getQuarantinedContentCount() {
  const [discussions, comments, debates] = await Promise.all([
    supabase
      .from('discussions')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'quarantined'),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'quarantined'),
    supabase
      .from('debates')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'quarantined'),
  ]);

  return (discussions.count || 0) + (comments.count || 0) + (debates.count || 0);
}
