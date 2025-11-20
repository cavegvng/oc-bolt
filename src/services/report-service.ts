import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { ContentType, ReportReason, ReportStatus } from '../types/moderation';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type ReportUpdate = Database['public']['Tables']['reports']['Update'];

export async function createReport(
  reporterId: string,
  contentType: ContentType,
  contentId: string,
  reason: ReportReason,
  description?: string
) {
  const reportData: ReportInsert = {
    reporter_id: reporterId,
    content_type: contentType,
    content_id: contentId,
    reason,
    description: description || null,
  };

  const { data, error } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReportById(reportId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reporter_id(username, avatar_url)')
    .eq('id', reportId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllReports(status?: ReportStatus, limit = 50, offset = 0) {
  let query = supabase
    .from('reports')
    .select('*, reporter:users!reporter_id(username, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
}

export async function getReportsByContent(contentType: ContentType, contentId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reporter_id(username, avatar_url)')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReportsByReason(reason: ReportReason, limit = 50) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reporter_id(username, avatar_url)')
    .eq('reason', reason)
    .eq('status', 'unresolved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  resolvedBy?: string
) {
  const updates: ReportUpdate = {
    status,
    resolved_by: resolvedBy || null,
    resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkResolveReports(reportIds: string[], status: ReportStatus, moderatorId: string) {
  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      resolved_by: moderatorId,
      resolved_at: new Date().toISOString(),
    })
    .in('id', reportIds)
    .select();

  if (error) throw error;
  return data;
}

export async function getPendingReportsCount() {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'unresolved');

  if (error) throw error;
  return count || 0;
}

export async function getReportStatsByReason() {
  const { data, error } = await supabase
    .from('reports')
    .select('reason')
    .eq('status', 'unresolved');

  if (error) throw error;

  const stats: Record<ReportReason, number> = {
    spam: 0,
    harassment: 0,
    misinformation: 0,
    inappropriate: 0,
    off_topic: 0,
    other: 0,
  };

  data?.forEach(report => {
    stats[report.reason as ReportReason]++;
  });

  return stats;
}
