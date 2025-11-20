import { supabase } from '../lib/supabase';
import type { ModerationMetrics } from '../types/moderation';

export async function getDashboardMetrics(): Promise<ModerationMetrics> {
  const [users, discussions, comments, reports, quarantined, moderators] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('discussions').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unresolved'),
    Promise.all([
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
    ]),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .in('role', ['owner', 'admin', 'super_moderator', 'moderator']),
  ]);

  const quarantinedCount =
    (quarantined[0].count || 0) + (quarantined[1].count || 0) + (quarantined[2].count || 0);

  return {
    total_users: users.count || 0,
    total_discussions: discussions.count || 0,
    total_comments: comments.count || 0,
    pending_reports: reports.count || 0,
    quarantined_content: quarantinedCount,
    active_moderators: moderators.count || 0,
  };
}

export async function getRecentActivity(limit = 10) {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select('*, moderator:users!moderator_id(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getContentStatsByStatus() {
  const [discussions, comments, debates] = await Promise.all([
    supabase.from('discussions').select('moderation_status'),
    supabase.from('comments').select('moderation_status'),
    supabase.from('debates').select('moderation_status'),
  ]);

  const stats = {
    active: 0,
    pending: 0,
    quarantined: 0,
    approved: 0,
    removed: 0,
  };

  [discussions.data, comments.data, debates.data].forEach(data => {
    data?.forEach(item => {
      stats[item.moderation_status as keyof typeof stats]++;
    });
  });

  return stats;
}

export async function getUserGrowthData(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const dailyCounts: Record<string, number> = {};

  data?.forEach(user => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
}

export async function getModeratorActivityStats() {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select('moderator_id, moderator:users!moderator_id(username)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const activityMap: Record<string, { username: string; actions: number }> = {};

  data?.forEach(action => {
    const modId = action.moderator_id;
    if (!activityMap[modId]) {
      activityMap[modId] = {
        username: (action.moderator as any)?.username || 'Unknown',
        actions: 0,
      };
    }
    activityMap[modId].actions++;
  });

  return Object.entries(activityMap).map(([id, stats]) => ({
    moderator_id: id,
    username: stats.username,
    action_count: stats.actions,
  }));
}

export async function getContentVolumeByType() {
  const [discussions, comments, debates] = await Promise.all([
    supabase.from('discussions').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('debates').select('id', { count: 'exact', head: true }),
  ]);

  return {
    discussions: discussions.count || 0,
    comments: comments.count || 0,
    debates: debates.count || 0,
  };
}
