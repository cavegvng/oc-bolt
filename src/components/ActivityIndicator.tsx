interface ActivityIndicatorProps {
  active: boolean;
  className?: string;
}

export function ActivityIndicator({ active, className = '' }: ActivityIndicatorProps) {
  if (!active) return null;

  return (
    <div className={`relative ${className}`} title="Active discussion">
      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse">
        <div className="absolute inset-0 w-3 h-3 bg-red-600 rounded-full animate-ping opacity-75"></div>
      </div>
    </div>
  );
}
