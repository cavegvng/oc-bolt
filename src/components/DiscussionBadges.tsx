import { Star, Megaphone } from 'lucide-react';

interface DiscussionBadgesProps {
  isFeatured?: boolean;
  isPromoted?: boolean;
  className?: string;
}

export function DiscussionBadges({ isFeatured, isPromoted, className = '' }: DiscussionBadgesProps) {
  if (!isFeatured && !isPromoted) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {isFeatured && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-lg text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-white" />
          <span>Featured</span>
        </div>
      )}
      {isPromoted && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg text-xs font-bold">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Promoted</span>
        </div>
      )}
    </div>
  );
}
