import { Link } from 'react-router-dom';

interface UserLinkProps {
  userId: string;
  username: string;
  showAvatar?: boolean;
  avatarUrl?: string | null;
  className?: string;
  inline?: boolean;
}

export function UserLink({
  userId,
  username,
  showAvatar = false,
  avatarUrl,
  className = '',
  inline = false,
}: UserLinkProps) {
  if (username === 'Anonymous') {
    return <span className={className}>{username}</span>;
  }

  const baseClasses = inline
    ? 'text-red-600 hover:text-red-700 hover:underline transition-colors'
    : 'text-red-600 hover:text-red-700 transition-colors';

  const link = (
    <Link
      to={`/profile/${userId}`}
      className={`${baseClasses} ${className}`}
    >
      {username}
    </Link>
  );

  if (!showAvatar || !avatarUrl) {
    return link;
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={avatarUrl}
        alt={username}
        className="w-6 h-6 rounded-full object-cover ring-2 ring-white/20"
      />
      {link}
    </div>
  );
}
