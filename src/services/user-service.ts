import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { UserRole } from '../types/moderation';
import { logModerationAction } from './moderation-service';

type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface UserWithStats extends User {
  discussion_count: number;
  comment_count: number;
  debate_count: number;
}

export interface UserFilters {
  role?: UserRole | 'all';
  search?: string;
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const stats = await getUserStats(userId);

  return {
    ...data,
    discussion_count: stats.discussions_count,
    comment_count: stats.comments_count,
    debate_count: stats.debates_count,
  } as UserWithStats;
}

export async function getUsersByRole(role: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllUsers(
  filters: UserFilters = {},
  limit = 20,
  offset = 0
) {
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role);
  }

  if (filters.search && filters.search.trim()) {
    query = query.or(`username.ilike.%${filters.search.trim()}%,email.ilike.%${filters.search.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const usersWithStats: UserWithStats[] = await Promise.all(
    (data || []).map(async (user) => {
      const stats = await getUserStats(user.id);
      return {
        ...user,
        discussion_count: stats.discussions_count,
        comment_count: stats.comments_count,
        debate_count: stats.debates_count,
      };
    })
  );

  return { data: usersWithStats, count };
}

export async function searchUsers(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  moderatorId: string,
  reason: string
) {
  const { data: oldUserData, error: fetchError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  await logModerationAction(
    moderatorId,
    'change_role',
    'user',
    userId,
    reason,
    {
      old_role: oldUserData?.role,
      new_role: newRole,
    }
  );

  return data;
}

export async function updateUser(userId: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkUpdateUserRoles(userIds: string[], newRole: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole })
    .in('id', userIds)
    .select();

  if (error) throw error;
  return data;
}

export async function getUserStats(userId: string) {
  const [discussions, comments, debates] = await Promise.all([
    supabase
      .from('discussions')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('debates')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId),
  ]);

  return {
    discussions_count: discussions.count || 0,
    comments_count: comments.count || 0,
    debates_count: debates.count || 0,
  };
}

export async function getUserActivity(userId: string, limit = 10) {
  const [discussions, comments, debates] = await Promise.all([
    supabase
      .from('discussions')
      .select('id, title, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('comments')
      .select('id, content, created_at, discussion_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('debates')
      .select('id, topic, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  return {
    discussions: discussions.data || [],
    comments: comments.data || [],
    debates: debates.data || [],
  };
}

export async function getTotalUsersCount() {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export async function getUsersCountByRole() {
  const roles: UserRole[] = ['owner', 'admin', 'super_moderator', 'moderator', 'user'];

  const counts = await Promise.all(
    roles.map(async (role) => {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', role);
      return { role, count: count || 0 };
    })
  );

  return counts.reduce((acc, { role, count }) => {
    acc[role] = count;
    return acc;
  }, {} as Record<UserRole, number>);
}
