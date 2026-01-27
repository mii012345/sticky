'use client';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, color, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold border-2 border-white`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}

interface AvatarGroupProps {
  participants: { nickname: string; avatarColor: string }[];
  maxDisplay?: number;
}

export function AvatarGroup({ participants, maxDisplay = 4 }: AvatarGroupProps) {
  const displayParticipants = participants.slice(0, maxDisplay);
  const remaining = participants.length - maxDisplay;

  return (
    <div className="flex -space-x-2">
      {displayParticipants.map((p, index) => (
        <Avatar key={index} name={p.nickname} color={p.avatarColor} />
      ))}
      {remaining > 0 && (
        <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-600 border-2 border-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}
