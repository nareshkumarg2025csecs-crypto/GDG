import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, Flame, Award, Clock } from 'lucide-react';

interface EventsHeroProps {
  totalEvents: number;
  upcomingCount: number;
  pastCount: number;
  totalRegistrations: number;
}

export const EventsHero: React.FC<EventsHeroProps> = ({
  totalEvents,
  upcomingCount,
  pastCount,
  totalRegistrations,
}) => {
  return (
    <div className="relative pt-4 pb-8 sm:pb-12 text-center max-w-4xl mx-auto">
      {/* Decorative ambient background glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-3xl h-60 pointer-events-none -z-10 opacity-20 blur-3xl">
        <div className="w-full h-full bg-gradient-to-r from-google-blue/30 via-google-red/20 via-google-yellow/20 to-google-green/30 rounded-full" />
      </div>

      

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-foreground leading-[1.15]"
      >
        TECH WORKSHOPS &amp;{' '}
        <span className="text-google-blue">HACKATHONS</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
        className="mt-3.5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
      >
        Discover upcoming developer sessions, hands-on codelabs, and student community hackathons.
        Register in seconds and sync reminders directly to your Google Calendar.
      </motion.p>

      {/* Live Community Stat Strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.22 }}
        className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-md shadow-xs text-xs"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40">
          <Flame className="w-3.5 h-3.5 text-google-red" />
          <span className="text-muted-foreground">Upcoming:</span>
          <strong className="text-foreground font-mono font-bold">{upcomingCount} Sessions</strong>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40">
          <Calendar className="w-3.5 h-3.5 text-google-blue" />
          <span className="text-muted-foreground">Total Events:</span>
          <strong className="text-foreground font-mono font-bold">{totalEvents}</strong>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40">
          <Users className="w-3.5 h-3.5 text-google-green" />
          <span className="text-muted-foreground">Registrations:</span>
          <strong className="text-foreground font-mono font-bold">
            {totalRegistrations > 0 ? `${totalRegistrations}+` : 'Active'}
          </strong>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40">
          <Award className="w-3.5 h-3.5 text-google-yellow" />
          <span className="text-muted-foreground">Past Archive:</span>
          <strong className="text-foreground font-mono font-bold">{pastCount}</strong>
        </div>
      </motion.div>
    </div>
  );
};
