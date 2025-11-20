import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AdminLayout } from '../components/admin-layout';
import { StatusBadge } from '../components/status-badge';
import { getAllReports } from '../../services/report-service';
import { updateReportStatus } from '../../services/report-service';
import { useAuth } from '../../contexts/AuthContext';
import type { ReportStatus } from '../../types/moderation';

export function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('unresolved');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const { data } = await getAllReports(filter);
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    if (!user?.id) return;

    try {
      await updateReportStatus(reportId, 'resolved', user.id);
      await loadReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    if (!user?.id) return;

    try {
      await updateReportStatus(reportId, 'dismissed', user.id);
      await loadReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Failed to dismiss report');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and manage user-submitted reports
          </p>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'unresolved' as const, label: 'Unresolved' },
            { key: 'in_progress' as const, label: 'In Progress' },
            { key: 'resolved' as const, label: 'Resolved' },
            { key: 'dismissed' as const, label: 'Dismissed' },
            { key: 'all' as const, label: 'All' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No reports match the selected filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <StatusBadge status={report.status} type="report" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {report.content_type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Reason: {report.reason}
                      </span>
                    </div>

                    <p className="text-sm text-gray-900 dark:text-white mb-2">
                      <span className="font-medium">Reported by:</span> {report.reporter?.username}
                    </p>

                    {report.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {report.description}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reported on {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>

                  {report.status === 'unresolved' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleDismissReport(report.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
