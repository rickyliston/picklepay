'use client';

interface AvatarProps {
  src: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-100 text-emerald-700 font-semibold ${className}`}
    >
      {initials}
    </div>
  );
}
