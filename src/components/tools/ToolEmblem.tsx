import React from 'react';
import {
  Sparkles,
  Globe,
  Smartphone,
  Cloud,
  Palette,
  MapPin,
  Terminal,
  GraduationCap,
  Layers,
  Code2,
} from 'lucide-react';

interface ToolEmblemProps {
  category: string;
  color: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  'ai-ml': Sparkles,
  web: Globe,
  mobile: Smartphone,
  cloud: Cloud,
  design: Palette,
  apis: MapPin,
  languages: Terminal,
  learning: GraduationCap,
};

export const ToolEmblem: React.FC<ToolEmblemProps> = ({
  category,
  color,
  name,
  size = 'md',
}) => {
  const IconComponent = CATEGORY_ICONS[category] || Code2;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-13 h-13 rounded-2xl text-base',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center font-bold tracking-wider transition-transform duration-200 group-hover:scale-105 ${sizeClasses}`}
      style={{
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}35`,
      }}
      aria-hidden="true"
    >
      <IconComponent className={iconSizes} />
      {/* Subtle brand glow in dark mode */}
      <div
        className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity blur-sm pointer-events-none -z-10"
        style={{ backgroundColor: `${color}25` }}
      />
    </div>
  );
};

export default ToolEmblem;
