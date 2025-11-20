import { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, FileText, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface ActivityItem {
  id: string;
  user_id: string;
  action_type: 'created_discussion' | 'posted_comment' | 'voted';
  discussion_id: string | null;
  created_at: string;
  users: {
    username: string;
  } | null;
  discussions: {
    id: string;
    title: string;
  } | null;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: '1', user_id: '1', action_type: 'created_discussion', discussion_id: '1', created_at: new Date().toISOString(), users: { username: 'DebateMaster' }, discussions: { id: '1', title: 'Is AI going to replace all developers?' } },
  { id: '2', user_id: '2', action_type: 'posted_comment', discussion_id: '2', created_at: new Date().toISOString(), users: { username: 'CodeNinja' }, discussions: { id: '2', title: 'The best programming language debate' } },
  { id: '3', user_id: '3', action_type: 'voted', discussion_id: '3', created_at: new Date().toISOString(), users: { username: 'ThinkTank' }, discussions: { id: '3', title: 'Remote work vs office work' } },
  { id: '4', user_id: '4', action_type: 'created_discussion', discussion_id: '4', created_at: new Date().toISOString(), users: { username: 'OpinionGuru' }, discussions: { id: '4', title: 'Why JavaScript is both loved and hated' } },
  { id: '5', user_id: '5', action_type: 'posted_comment', discussion_id: '5', created_at: new Date().toISOString(), users: { username: 'TechEnthusiast' }, discussions: { id: '5', title: 'The future of cryptocurrency' } },
  { id: '6', user_id: '6', action_type: 'voted', discussion_id: '6', created_at: new Date().toISOString(), users: { username: 'LogicLover' }, discussions: { id: '6', title: 'Is college education still worth it?' } },
  { id: '7', user_id: '7', action_type: 'created_discussion', discussion_id: '7', created_at: new Date().toISOString(), users: { username: 'CuriousMind' }, discussions: { id: '7', title: 'Climate change solutions we can all agree on' } },
  { id: '8', user_id: '8', action_type: 'posted_comment', discussion_id: '8', created_at: new Date().toISOString(), users: { username: 'SocialButterfly' }, discussions: { id: '8', title: 'The decline of social media' } },
  { id: '9', user_id: '9', action_type: 'voted', discussion_id: '9', created_at: new Date().toISOString(), users: { username: 'DeepThinker' }, discussions: { id: '9', title: 'Universal basic income: pros and cons' } },
  { id: '10', user_id: '10', action_type: 'created_discussion', discussion_id: '10', created_at: new Date().toISOString(), users: { username: 'WiseOwl' }, discussions: { id: '10', title: 'The best way to learn new skills' } },
];

export function ActivityTicker() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    const { data } = await supabase
      .from('activity_feed')
      .select('*, users!activity_feed_user_id_fkey(username), discussions(id, title)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      setActivities(data as ActivityItem[]);
    }
  };

  const displayActivities = activities.length > 0 ? activities : SAMPLE_ACTIVITIES;

  const getActionText = (activity: ActivityItem) => {
    const username = activity.users?.username || 'Someone';
    switch (activity.action_type) {
      case 'created_discussion':
        return `${username} started a discussion`;
      case 'posted_comment':
        return `${username} commented on ${activity.discussions?.title || 'a discussion'}`;
      case 'voted':
        return `${username} voted`;
      default:
        return `${username} took action`;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created_discussion':
        return FileText;
      case 'posted_comment':
        return MessageSquare;
      case 'voted':
        return ThumbsUp;
      default:
        return Activity;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-border overflow-hidden z-40 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 dark:block hidden pointer-events-none"></div>
      <div className="flex items-center h-9 relative z-10">
        <div className="flex-shrink-0 px-3 flex items-center gap-2 bg-blue-600 dark:bg-blue-700 h-full">
          <Activity className="w-4 h-4 text-white animate-pulse" />
          <span className="text-white font-semibold text-xs uppercase tracking-wide">Live</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white dark:from-card to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white dark:from-card to-transparent z-10 pointer-events-none"></div>
          <div className="animate-scroll-slow flex items-center h-full whitespace-nowrap">
            {[...displayActivities, ...displayActivities].map((activity, index) => {
              const Icon = getActionIcon(activity.action_type);
              return (
                <Link
                  key={`${activity.id}-${index}`}
                  to={activity.discussion_id ? `/discussions/${activity.discussion_id}` : '#'}
                  className="inline-flex items-center gap-2 px-4 text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="mr-4">{getActionText(activity)}</span>
                  <span className="text-muted-foreground">•</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll-slow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-slow {
          animation: scroll-slow 60s linear infinite;
        }
        .animate-scroll-slow:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
