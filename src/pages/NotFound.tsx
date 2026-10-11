import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Calendar } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground px-4 py-12 selection:bg-google-blue/20 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-google-blue/10 dark:bg-google-blue/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-google-yellow/10 dark:bg-google-yellow/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-lg p-6 sm:p-10 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl text-card-foreground shadow-2xl text-center space-y-6 relative overflow-hidden"
      >
        {/* Top Google 4-Color Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex w-full">
          <div className="flex-1 bg-google-blue" />
          <div className="flex-1 bg-google-red" />
          <div className="flex-1 bg-google-yellow" />
          <div className="flex-1 bg-google-green" />
        </div>

        {/* Mascot Centerpiece */}
        <div className="pt-2 flex justify-center">
          <div className="relative inline-flex items-center justify-center">
            <img
              src="/gdg-cat.png"
              alt="GDG cat mascot"
              className="h-[160px] sm:h-[210px] w-auto select-none pointer-events-none object-contain"
              draggable={false}
            />
            {/* Separate question-mark symbol beside the cat */}
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-5 sm:-right-7 text-3xl sm:text-4xl font-extrabold text-google-blue select-none rotate-12"
            >
              ?
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-google-red/10 text-google-red border border-google-red/20">
            Error 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-foreground">
            404 — Even our cat couldn't find this page.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
            Looks like this page went off the grid or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-sm font-semibold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 active:scale-95"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Return to Home</span>
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl border border-border hover:bg-muted text-foreground text-sm font-semibold transition-all active:scale-95"
          >
            <Calendar className="w-4 h-4 text-google-yellow" aria-hidden="true" />
            <span>Browse Events</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
