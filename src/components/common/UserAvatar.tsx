import React, { useState } from 'react';

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const AVATAR_COLORS = [
  '#4285F4', // Google Blue
  '#34A853', // Google Green
  '#EA4335', // Google Red
  '#FBBC04', // Google Yellow
  '#A142F4', // Purple
  '#00897B', // Teal
  '#E91E63', // Pink
  '#3F51B5', // Indigo
  '#00ACC1', // Cyan
  '#FB8C00', // Deep Orange
];

/**
 * Computes a deterministic integer hash from a string to derive stable colors.
 */
function getStableColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-4xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  email,
  avatarUrl,
  userId,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = (name?.trim() || email?.trim() || 'U').charAt(0).toUpperCase();
  const seed = (userId || email || name || 'user').toLowerCase();
  const bgColor = getStableColor(seed);

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const borderClass = showBorder ? 'ring-2 ring-background shadow-sm' : '';

  // If Google/Custom avatar URL provided and not broken
  if (avatarUrl && !imgError) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${sizeClass} ${borderClass} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name || email || 'User Avatar'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Consistent letter avatar fallback
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-sans font-bold text-white uppercase select-none ${sizeClass} ${borderClass} ${className}`}
      style={{
        backgroundColor: bgColor,
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }}
      title={name || email || 'User'}
    >
      <span>{initial}</span>
    </div>
  );
};

export default UserAvatar;
