import { useEffect, useState } from 'react';
import { Users, MessageSquare, Flag, Shield, TrendingUp, Activity } from 'lucide-react';
import { MetricCard } from '../components/metric-card';
import { getDashboardMetrics, getRecentActivity } from '../../services/analytics-service';
import type { ModerationMetrics } from '../../types/moderation';

export function DashboardPage() {
  const [metrics, setMetrics] = useState<ModerationMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsData, activityData] = await Promise.all([
        getDashboardMetrics(),
        getRecentActivity(5),
      ]);
      setMetrics(metricsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics?.total_users || 0}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Discussions"
          value={metrics?.total_discussions || 0}
          icon={MessageSquare}
          color="green"
        />
        <MetricCard
          title="Total Comments"
          value={metrics?.total_comments || 0}
          icon={Activity}
          color="purple"
        />
        <MetricCard
          title="Pending Reports"
          value={metrics?.pending_reports || 0}
          icon={Flag}
          color="red"
        />
        <MetricCard
          title="Quarantined Content"
          value={metrics?.quarantined_content || 0}
          icon={Shield}
          color="yellow"
        />
        <MetricCard
          title="Active Moderators"
          value={metrics?.active_moderators || 0}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recent moderation activity
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b border-border last:border-0"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.moderator?.username}</span> performed{' '}
                      <span className="font-medium">{activity.action_type}</span> action
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
