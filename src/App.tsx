import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EasterEggProvider } from "@/components/easter-eggs/EasterEggProvider";
import CustomCursor from "@/components/CustomCursor";
import Index from "./pages/Index";
import TeamPage from "./pages/TeamPage";
import NotFound from "./pages/NotFound";
import { useLenis } from "@/lib/scroll";

const queryClient = new QueryClient();

const App = () => {
  useLenis();
  
  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <EasterEggProvider>
          <CustomCursor />
          <div data-no-leet>
            <Toaster />
            <Sonner />
          </div>
          <div data-easter-content className="contents">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/team" element={<TeamPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </EasterEggProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;

