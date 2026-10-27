// Stylised SVG character portraits. One component draws every character from
// a small "look" description, so new characters need no new art files.

import { useId } from 'react';
import type { Character, Mood } from '../engine/types';

interface Props {
  look: Character['look'];
  mood?: Mood;
  size?: number;
  /** Accessible name. Omit when the portrait sits next to a visible name. */
  label?: string;
  className?: string;
}

function hair(style: Character['look']['hairStyle'], color: string) {
  switch (style) {
    case 'long':
      return <path d="M27 44c0-17 10-27 23-27s23 10 23 27v26c-4 2-7 2-9 0V46c-6-4-20-4-28 0v24c-2 2-5 2-9 0z" fill={color} />;
    case 'bun':
      return (
        <g fill={color}>
          <circle cx="50" cy="14" r="8" />
          <path d="M29 44c0-15 9-24 21-24s21 9 21 24c-5-7-14-10-21-10s-16 3-21 10z" />
        </g>
      );
    case 'curly':
      return (
        <g fill={color}>
          {[30, 38, 46, 54, 62, 70].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 24 : 28} r="8" />)}
          <circle cx="27" cy="38" r="6" />
          <circle cx="73" cy="38" r="6" />
        </g>
      );
    case 'shaved':
      return <path d="M31 40c1-12 9-19 19-19s18 7 19 19c-6-5-12-7-19-7s-13 2-19 7z" fill={color} opacity="0.55" />;
    case 'fade':
      return <path d="M30 40c0-13 9-21 20-21s20 8 20 21c-3-2-5-3-6-6-4 2-24 2-28 0-1 3-3 4-6 6z" fill={color} />;
    case 'short':
    default:
      return <path d="M29 42c0-15 9-24 21-24 13 0 22 9 21 24-3-6-9-9-15-9-6 3-17 3-22 0-2 3-4 6-5 9z" fill={color} />;
  }
}

function face(mood: Mood) {
  const brows: Record<Mood, string> = {
    neutral: 'M40 41h7M53 41h7',
    relieved: 'M40 40.5q3.5-1.5 7 0M53 40.5q3.5-1.5 7 0',
    encouraged: 'M40 40q3.5-2 7 0M53 40q3.5-2 7 0',
    concerned: 'M40 42l7-2M53 40l7 2',
    frustrated: 'M40 39l7 3M53 42l7-3',
    withdrawn: 'M40 42h7M53 42h7',
  };
  const mouths: Record<Mood, string> = {
    neutral: 'M45 58h10',
    relieved: 'M44 57q6 4 12 0',
    encouraged: 'M43 56q7 6 14 0',
    concerned: 'M45 59q5-3 10 0',
    frustrated: 'M44 59q6-4 12 0',
    withdrawn: 'M46 59h8',
  };
  const eyeY = mood === 'withdrawn' ? 47 : 46;
  return (
    <g stroke="#1a1414" strokeWidth="1.6" strokeLinecap="round" fill="none">
      <path d={brows[mood]} />
      <circle cx="43.5" cy={eyeY} r="1.6" fill="#1a1414" stroke="none" />
      <circle cx="56.5" cy={eyeY} r="1.6" fill="#1a1414" stroke="none" />
      <path d={mouths[mood]} />
    </g>
  );
}

export function Portrait({ look, mood = 'neutral', size = 72, label, className }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={`portrait ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={look.accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0b0c12" stopOpacity="1" />
        </radialGradient>
        <clipPath id={`clip-${id}`}><circle cx="50" cy="50" r="48" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#bg-${id})`} />
      <g clipPath={`url(#clip-${id})`}>
        <path d="M14 104c2-20 16-30 36-30s34 10 36 30z" fill={look.outfit} />
        <path d="M38 76l12 10 12-10" stroke={look.accent} strokeWidth="2.5" fill="none" />
        <rect x="44" y="60" width="12" height="14" rx="5" fill={look.skin} />
        <ellipse cx="50" cy="46" rx="17" ry="20" fill={look.skin} />
        <path d="M67 40a17 20 0 0 1-6 22" stroke={look.accent} strokeOpacity="0.5" strokeWidth="2" fill="none" />
        {hair(look.hairStyle, look.hair)}
        {face(mood)}
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke={look.accent} strokeOpacity="0.6" strokeWidth="1.5" />
    </svg>
  );
}
