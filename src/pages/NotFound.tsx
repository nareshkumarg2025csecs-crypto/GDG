import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground px-4 selection:bg-google-blue/20">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl border border-border bg-card text-card-foreground shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Top Google Colors Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex w-full">
          <div className="flex-1 bg-google-blue" />
          <div className="flex-1 bg-google-red" />
          <div className="flex-1 bg-google-yellow" />
          <div className="flex-1 bg-google-green" />
        </div>

        <div className="space-y-2 pt-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-google-red/10 text-google-red border border-google-red/20">
            Error 404
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold font-sans tracking-tight text-foreground">
            404
          </h1>
          <p className="text-lg font-semibold text-foreground">
            Page Not Found
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
