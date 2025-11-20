import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface HotTopic {
  id: string;
  discussion_id: string;
  trending_score: number;
  discussions: {
    id: string;
    title: string;
  } | null;
}

const SAMPLE_HOT_TOPICS = [
  { id: '1', discussion_id: '1', title: 'Is pineapple on pizza a crime against humanity or culinary genius?' },
  { id: '2', discussion_id: '2', title: 'Why standing desks are overrated and sitting is actually fine' },
  { id: '3', discussion_id: '3', title: 'The Oxford comma: essential punctuation or unnecessary clutter?' },
  { id: '4', discussion_id: '4', title: 'Hot take: Morning people are just sleep-deprived night owls' },
  { id: '5', discussion_id: '5', title: 'Tabs vs Spaces: The debate that will never end' },
  { id: '6', discussion_id: '6', title: 'Is cereal a soup? Let\'s settle this once and for all' },
  { id: '7', discussion_id: '7', title: 'Why I think cats are plotting world domination' },
  { id: '8', discussion_id: '8', title: 'The superiority of dark mode over light mode' },
];

export function HotNowTicker() {
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);

  useEffect(() => {
    loadHotTopics();
    const interval = setInterval(loadHotTopics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHotTopics = async () => {
    const { data } = await supabase
      .from('hot_topics')
      .select('*, discussions(id, title)')
      .order('trending_score', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      setHotTopics(data as HotTopic[]);
    }
  };

  const displayTopics = hotTopics.length > 0 ? hotTopics : SAMPLE_HOT_TOPICS.map(t => ({
    id: t.id,
    discussion_id: t.discussion_id,
    trending_score: 0,
    discussions: { id: t.discussion_id, title: t.title }
  }));

  return (
    <div className="bg-gray-100 dark:bg-card border-b border-border overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 dark:block hidden pointer-events-none"></div>
      <div className="flex items-center h-10 relative z-10">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 h-full">
          <Flame className="w-4 h-4 text-red-600 dark:text-red-500 animate-pulse" />
          <span className="text-foreground font-bold text-sm uppercase tracking-wide">Hot Now</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-100 dark:from-card to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-100 dark:from-card to-transparent z-10 pointer-events-none"></div>
          <div className="animate-scroll flex items-center h-full whitespace-nowrap">
            {[...displayTopics, ...displayTopics].map((topic, index) => (
              <Link
                key={`${topic.id}-${index}`}
                to={`/discussions/${topic.discussion_id}`}
                className="inline-flex items-center px-6 text-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm"
              >
                <span className="mr-6">{topic.discussions?.title}</span>
                <span className="text-muted-foreground">•</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
