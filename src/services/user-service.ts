import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { UserRole } from '../types/moderation';

type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
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

export async function getAllUsers(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
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

export async function updateUserRole(userId: string, newRole: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
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
