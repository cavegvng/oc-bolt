import { supabase } from '../lib/supabase';

type ModerationStatus = 'approved' | 'pending' | 'quarantined' | 'removed';

interface DiscussionControlUpdate {
  is_featured?: boolean;
  is_promoted?: boolean;
  is_pinned?: boolean;
  promoted_end_date?: string | null;
  moderation_status?: ModerationStatus;
}

export async function toggleDiscussionFeatured(
  discussionId: string,
  userId: string,
  value: boolean
) {
  const updates: any = {
    is_featured: value,
    featured_at: value ? new Date().toISOString() : null,
    featured_by: value ? userId : null,
  };

  const { error } = await supabase
    .from('discussions')
    .update(updates)
    .eq('id', discussionId);

  if (error) throw error;

  await logAudit(
    discussionId,
    userId,
    value ? 'featured' : 'unfeatured',
    'is_featured',
    !value,
    value
  );

  if (value) {
    await sendFeaturedNotification(discussionId, userId);
  }
}

export async function toggleDiscussionPromoted(
  discussionId: string,
  userId: string,
  value: boolean,
  endDate?: string | null
) {
  const updates: any = {
    is_promoted: value,
    promoted_start_date: value ? new Date().toISOString() : null,
    promoted_end_date: value && endDate ? endDate : null,
    promoted_by: value ? userId : null,
  };

  const { error } = await supabase
    .from('discussions')
    .update(updates)
    .eq('id', discussionId);

  if (error) throw error;

  await logAudit(
    discussionId,
    userId,
    value ? 'promoted' : 'unpromoted',
    'is_promoted',
    !value,
    value
  );
}

export async function toggleDiscussionPinned(
  discussionId: string,
  userId: string,
  value: boolean
) {
  const updates: any = {
    is_pinned: value,
  };

  const { error } = await supabase
    .from('discussions')
    .update(updates)
    .eq('id', discussionId);

  if (error) throw error;

  await logAudit(
    discussionId,
    userId,
    value ? 'pinned' : 'unpinned',
    'is_pinned',
    !value,
    value
  );
}

export async function bulkUpdateDiscussionControls(
  discussionIds: string[],
  updates: DiscussionControlUpdate,
  userId: string
) {
  const timestamp = new Date().toISOString();
  const dbUpdates: any = { ...updates };

  if (updates.is_featured !== undefined) {
    dbUpdates.featured_at = updates.is_featured ? timestamp : null;
    dbUpdates.featured_by = updates.is_featured ? userId : null;
  }

  if (updates.is_promoted !== undefined) {
    dbUpdates.promoted_start_date = updates.is_promoted ? timestamp : null;
    dbUpdates.promoted_by = updates.is_promoted ? userId : null;
    if (!updates.is_promoted) {
      dbUpdates.promoted_end_date = null;
    }
  }

  if (updates.moderation_status !== undefined) {
    dbUpdates.moderated_by = userId;
    dbUpdates.last_moderation_action = timestamp;
  }

  const { error } = await supabase
    .from('discussions')
    .update(dbUpdates)
    .in('id', discussionIds);

  if (error) throw error;

  const auditPromises = discussionIds.map(async (discussionId) => {
    const promises: Promise<any>[] = [];

    if (updates.is_featured !== undefined) {
      promises.push(
        logAudit(
          discussionId,
          userId,
          updates.is_featured ? 'featured' : 'unfeatured',
          'is_featured',
          !updates.is_featured,
          updates.is_featured
        )
      );

      if (updates.is_featured) {
        promises.push(sendFeaturedNotification(discussionId, userId));
      }
    }

    if (updates.is_promoted !== undefined) {
      promises.push(
        logAudit(
          discussionId,
          userId,
          updates.is_promoted ? 'promoted' : 'unpromoted',
          'is_promoted',
          !updates.is_promoted,
          updates.is_promoted
        )
      );
    }

    if (updates.is_pinned !== undefined) {
      promises.push(
        logAudit(
          discussionId,
          userId,
          updates.is_pinned ? 'pinned' : 'unpinned',
          'is_pinned',
          !updates.is_pinned,
          updates.is_pinned
        )
      );
    }

    if (updates.moderation_status !== undefined) {
      promises.push(
        logAudit(
          discussionId,
          userId,
          `moderation_${updates.moderation_status}`,
          'moderation_status',
          null,
          updates.moderation_status
        )
      );
    }

    return Promise.all(promises);
  });

  await Promise.all(auditPromises);
}

export async function updatePromotionExpiration(
  discussionId: string,
  userId: string,
  endDate: string | null
) {
  const { error } = await supabase
    .from('discussions')
    .update({ promoted_end_date: endDate })
    .eq('id', discussionId);

  if (error) throw error;

  await logAudit(
    discussionId,
    userId,
    'promoted',
    'promoted_end_date',
    null,
    endDate
  );
}

export async function getDiscussionAuditLog(discussionId: string) {
  const { data, error } = await supabase
    .from('discussion_control_audit_log')
    .select('*, users!discussion_control_audit_log_user_id_fkey(username)')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllDiscussionsWithControls() {
  const { data, error } = await supabase
    .from('discussions')
    .select(`
      id,
      title,
      description,
      author_id,
      category_id,
      is_featured,
      is_promoted,
      is_pinned,
      promoted_end_date,
      moderation_status,
      view_count,
      created_at,
      users!discussions_author_id_fkey(username, avatar_url),
      categories(name, color)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function logAudit(
  discussionId: string,
  userId: string,
  actionType: string,
  fieldChanged: string,
  oldValue: any,
  newValue: any
) {
  const { error } = await supabase
    .from('discussion_control_audit_log')
    .insert({
      discussion_id: discussionId,
      user_id: userId,
      action_type: actionType,
      field_changed: fieldChanged,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
    });

  if (error) console.error('Error logging audit:', error);
}

async function sendFeaturedNotification(discussionId: string, userId: string) {
  const { data: discussion } = await supabase
    .from('discussions')
    .select('author_id, title')
    .eq('id', discussionId)
    .maybeSingle();

  if (!discussion) return;

  const { data: userData } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  await supabase.from('notifications').insert({
    user_id: discussion.author_id,
    type: 'discussion_featured',
    title: 'Your discussion has been featured!',
    message: `Your discussion "${discussion.title}" has been featured by ${userData?.username || 'a moderator'}`,
    link: `/discussions/${discussionId}`,
  });
}

export async function updateDiscussionModerationStatus(
  discussionId: string,
  status: ModerationStatus,
  moderatorId: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('discussions')
    .update({
      moderation_status: status,
      moderated_by: moderatorId,
      last_moderation_action: new Date().toISOString(),
    })
    .eq('id', discussionId)
    .select()
    .single();

  if (error) throw error;

  await logAudit(
    discussionId,
    moderatorId,
    `moderation_${status}`,
    'moderation_status',
    null,
    status
  );

  if (['quarantined', 'removed'].includes(status) && reason) {
    await supabase.from('content_restrictions').insert({
      content_type: 'discussion',
      content_id: discussionId,
      restriction_type: status,
      moderator_id: moderatorId,
      reason: reason,
    });
  }

  return data;
}

export async function restoreDiscussion(
  discussionId: string,
  moderatorId: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('discussions')
    .update({
      moderation_status: 'approved',
      moderated_by: moderatorId,
      last_moderation_action: new Date().toISOString(),
    })
    .eq('id', discussionId)
    .select()
    .single();

  if (error) throw error;

  await logAudit(
    discussionId,
    moderatorId,
    'moderation_restored',
    'moderation_status',
    null,
    'approved'
  );

  await supabase.from('content_restrictions').insert({
    content_type: 'discussion',
    content_id: discussionId,
    restriction_type: 'restored',
    moderator_id: moderatorId,
    reason: reason || 'Content restored by moderator',
  });

  return data;
}

export async function getDiscussionModerationHistory(discussionId: string) {
  const { data, error } = await supabase
    .from('content_restrictions')
    .select('*, moderator:users!moderator_id(username, avatar_url)')
    .eq('content_type', 'discussion')
    .eq('content_id', discussionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
