import { supabase } from '../lib/supabase';

export async function deleteDiscussion(discussionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('discussion_control_audit_log').insert({
      discussion_id: discussionId,
      user_id: userId,
      action_type: 'deleted',
      field_changed: 'deleted',
      old_value: 'exists',
      new_value: 'permanently_deleted',
    });

    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', discussionId);

    if (error) {
      console.error('Error deleting discussion:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception deleting discussion:', error);
    return { success: false, error: 'Failed to delete discussion' };
  }
}

export async function deleteDebate(debateId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('debates')
      .delete()
      .eq('id', debateId);

    if (error) {
      console.error('Error deleting debate:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception deleting debate:', error);
    return { success: false, error: 'Failed to delete debate' };
  }
}

export async function bulkDeleteDiscussions(
  discussionIds: string[],
  userId: string
): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    const auditLogs = discussionIds.map((id) => ({
      discussion_id: id,
      user_id: userId,
      action_type: 'bulk_deleted',
      field_changed: 'deleted',
      old_value: 'exists',
      new_value: 'permanently_deleted',
    }));

    await supabase.from('discussion_control_audit_log').insert(auditLogs);

    const { error, count } = await supabase
      .from('discussions')
      .delete()
      .in('id', discussionIds);

    if (error) {
      console.error('Error bulk deleting discussions:', error);
      return { success: false, processed: 0, error: error.message };
    }

    return { success: true, processed: count || discussionIds.length };
  } catch (error) {
    console.error('Exception bulk deleting discussions:', error);
    return { success: false, processed: 0, error: 'Failed to bulk delete discussions' };
  }
}

export async function bulkDeleteDebates(
  debateIds: string[],
  userId: string
): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    const { error, count } = await supabase
      .from('debates')
      .delete()
      .in('id', debateIds);

    if (error) {
      console.error('Error bulk deleting debates:', error);
      return { success: false, processed: 0, error: error.message };
    }

    return { success: true, processed: count || debateIds.length };
  } catch (error) {
    console.error('Exception bulk deleting debates:', error);
    return { success: false, processed: 0, error: 'Failed to bulk delete debates' };
  }
}

export async function bulkUpdateCategories(
  discussionIds: string[],
  categoryIds: string[],
  userId: string
): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    const { error, count } = await supabase
      .from('discussions')
      .update({
        category_ids: categoryIds,
      })
      .in('id', discussionIds);

    if (error) {
      console.error('Error bulk updating categories:', error);
      return { success: false, processed: 0, error: error.message };
    }

    const auditLogs = discussionIds.map((id) => ({
      discussion_id: id,
      user_id: userId,
      action_type: 'bulk_category_update',
      field_changed: 'category_ids',
      old_value: 'various',
      new_value: JSON.stringify(categoryIds),
    }));

    await supabase.from('discussion_control_audit_log').insert(auditLogs);

    return { success: true, processed: count || discussionIds.length };
  } catch (error) {
    console.error('Exception bulk updating categories:', error);
    return { success: false, processed: 0, error: 'Failed to bulk update categories' };
  }
}
