import React, { useState } from 'react';
import { UserStatus } from '../../types';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: UserStatus;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const statusSizes = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
  '2xl': 'w-6 h-6 ring-4',
};

const statusColors: Record<UserStatus, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-500',
  dnd: 'bg-rose-500',
  offline: 'bg-neutral-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Generate fallback initials
  const initials = alt
    ? alt
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className={`relative inline-block shrink-0 ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-indigo-900/60 to-purple-900/60 ring-1 ring-white/10 flex items-center justify-center select-none font-semibold text-neutral-200">
        {src && !imageFailed ? (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-neutral-950 ${statusColors[status]} ${statusSizes[size]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
