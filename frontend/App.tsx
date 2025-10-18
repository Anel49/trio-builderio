import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { CookieBanner, CookiePreferences } from "@/components/ui/cookie-banner";
import { COMPANY_NAME } from "@/lib/constants";
import SplashOnboarding from "@/components/ui/splash-onboarding";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionLoginWall } from "@/components/SessionLoginWall";

const Index = lazy(() => import("./pages/Index"));
const BrowseListings = lazy(() => import("./pages/BrowseListings"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const UploadProduct = lazy(() => import("./pages/UploadProduct"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted terms
    const hasAcceptedTerms = localStorage.getItem(
      `${COMPANY_NAME.toLowerCase()}-terms-accepted`,
    );
    const hasAcceptedCookies = localStorage.getItem(
      `${COMPANY_NAME.toLowerCase()}-cookies-accepted`,
    );
    const splashCompleted =
      localStorage.getItem(`${COMPANY_NAME.toLowerCase()}-splash-completed`) ===
      "true";

    if (!hasAcceptedTerms) {
      // SplashOnboarding will handle showing Terms of Service
    } else if (!hasAcceptedCookies) {
      // Show cookie banner only after terms are accepted
      setShowCookieBanner(true);
    }

    const handleTermsAccepted = () => {
      const cookiesAccepted = localStorage.getItem(
        `${COMPANY_NAME.toLowerCase()}-cookies-accepted`,
      );
      if (cookiesAccepted !== "true") setShowCookieBanner(true);
    };
    window.addEventListener(
      "lendit-terms-accepted",
      handleTermsAccepted as EventListener,
    );
    return () => {
      window.removeEventListener(
        "lendit-terms-accepted",
        handleTermsAccepted as EventListener,
      );
    };
  }, []);

  const handleCookiePreferences = (preferences: CookiePreferences) => {
    localStorage.setItem(
      `${COMPANY_NAME.toLowerCase()}-cookies-accepted`,
      "true",
    );
    localStorage.setItem(
      `${COMPANY_NAME.toLowerCase()}-cookie-preferences`,
      JSON.stringify(preferences),
    );
    setShowCookieBanner(false);

    // You can use the preferences to configure your analytics/marketing tools here
    console.log("Cookie preferences saved:", preferences);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SplashOnboarding />
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<BrowseListings />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/upload" element={<UploadProduct />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/TermsOfService" element={<TermsOfService />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <CookieBanner
          isOpen={showCookieBanner}
          onAccept={handleCookiePreferences}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const container = document.getElementById("root")!;
let root = (container as any)._reactRoot;

if (!root) {
  root = createRoot(container);
  (container as any)._reactRoot = root;
}

root.render(<App />);
