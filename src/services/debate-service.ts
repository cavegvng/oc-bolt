import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Debate = Database['public']['Tables']['debates']['Row'];
type DebateUpdate = Database['public']['Tables']['debates']['Update'];

interface UpdateDebateParams {
  debateId: string;
  userId: string;
  userRole: Database['public']['Tables']['users']['Row']['role'];
  updates: {
    topic?: string;
    description?: string;
    category_id?: string | null;
    end_date?: string | null;
    duration_days?: number | null;
    is_locked?: boolean;
    is_featured?: boolean;
    moderation_status?: 'approved' | 'pending' | 'quarantined' | 'removed';
  };
}

export async function updateDebate({ debateId, userId, userRole, updates }: UpdateDebateParams) {
  const { data: debate, error: fetchError } = await supabase
    .from('debates')
    .select('*')
    .eq('id', debateId)
    .maybeSingle();

  if (fetchError || !debate) {
    throw new Error('Debate not found');
  }

  const isAuthor = debate.author_id === userId;
  const isSuperModOrAbove = ['owner', 'admin', 'super_moderator'].includes(userRole);

  if (!isAuthor && !isSuperModOrAbove) {
    throw new Error('You do not have permission to edit this debate');
  }

  const allowedUpdates: DebateUpdate = {};

  if (updates.topic !== undefined) allowedUpdates.topic = updates.topic;
  if (updates.description !== undefined) allowedUpdates.description = updates.description;
  if (updates.category_id !== undefined) allowedUpdates.category_id = updates.category_id;

  if (updates.end_date !== undefined) {
    allowedUpdates.end_date = updates.end_date;
  }

  if (updates.duration_days !== undefined) {
    allowedUpdates.duration_days = updates.duration_days;

    if (updates.duration_days && updates.duration_days > 0) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + updates.duration_days);
      allowedUpdates.end_date = endDate.toISOString();
    }
  }

  if (isSuperModOrAbove) {
    if (updates.is_locked !== undefined) allowedUpdates.is_locked = updates.is_locked;
    if (updates.is_featured !== undefined) allowedUpdates.is_featured = updates.is_featured;
    if (updates.moderation_status !== undefined) allowedUpdates.moderation_status = updates.moderation_status;
  }

  allowedUpdates.last_edited_by = userId;
  allowedUpdates.last_edited_at = new Date().toISOString();
  allowedUpdates.updated_at = new Date().toISOString();

  const { data: updatedDebate, error: updateError } = await supabase
    .from('debates')
    .update(allowedUpdates)
    .eq('id', debateId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  const changedFields = Object.keys(allowedUpdates)
    .filter(key => key !== 'last_edited_by' && key !== 'last_edited_at' && key !== 'updated_at')
    .reduce((acc, key) => {
      const typedKey = key as keyof typeof debate;
      acc[key] = {
        old: debate[typedKey],
        new: allowedUpdates[key as keyof typeof allowedUpdates]
      };
      return acc;
    }, {} as Record<string, { old: unknown; new: unknown }>);

  await supabase
    .from('moderation_actions')
    .insert({
      moderator_id: userId,
      action_type: 'edit',
      target_type: 'debate',
      target_id: debateId,
      reason: 'Debate edited',
      details: { changed_fields: changedFields }
    });

  return updatedDebate;
}

export async function checkAndLockConcludedDebates() {
  const { data, error } = await supabase.rpc('check_and_lock_concluded_debates');

  if (error) {
    console.error('Error checking concluded debates:', error);
    return 0;
  }

  return data as number;
}

export async function getDebateParticipants(debateId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('debate_stances')
    .select('user_id')
    .eq('debate_id', debateId);

  if (error) {
    console.error('Error fetching debate participants:', error);
    return [];
  }

  return [...new Set(data.map(stance => stance.user_id))];
}

export async function notifyDebateConcluded(debateId: string) {
  const { data: debate, error: debateError } = await supabase
    .from('debates')
    .select('topic')
    .eq('id', debateId)
    .maybeSingle();

  if (debateError || !debate) {
    console.error('Error fetching debate:', debateError);
    return;
  }

  const participantIds = await getDebateParticipants(debateId);

  if (participantIds.length === 0) {
    return;
  }

  const notifications = participantIds.map(userId => ({
    user_id: userId,
    type: 'debate_concluded',
    title: 'Debate Has Concluded',
    content: `The debate "${debate.topic}" has concluded. View the final results!`,
    link_url: `/debates/${debateId}`,
    read: false
  }));

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (notificationError) {
    console.error('Error sending notifications:', notificationError);
  }
}

export async function checkDebateStatus(debateId: string): Promise<{ isConcluded: boolean; shouldLock: boolean }> {
  const { data: debate, error } = await supabase
    .from('debates')
    .select('end_date, is_locked')
    .eq('id', debateId)
    .maybeSingle();

  if (error || !debate) {
    return { isConcluded: false, shouldLock: false };
  }

  if (!debate.end_date) {
    return { isConcluded: false, shouldLock: false };
  }

  const endDate = new Date(debate.end_date);
  const now = new Date();
  const isConcluded = endDate <= now;
  const shouldLock = isConcluded && !debate.is_locked;

  if (shouldLock) {
    await supabase
      .from('debates')
      .update({ is_locked: true })
      .eq('id', debateId);

    await notifyDebateConcluded(debateId);
  }

  return { isConcluded, shouldLock };
}
