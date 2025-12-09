import { Container } from "./Container";
import { resetCookiePreferences } from "@/lib/cookie-utils";
import { COMPANY_NAME } from "@/lib/constants";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BankingSetupModal } from "./ui/banking-setup-modal";

export function Footer() {
  const handleClearCookies = async () => {
    // Clear all website cookies and session
    try {
      // Call logout to destroy the server-side session
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    // Clear all browser cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });

    // Clear localStorage items related to onboarding and preferences
    localStorage.removeItem(`${COMPANY_NAME.toLowerCase()}-splash-completed`);
    localStorage.removeItem(`${COMPANY_NAME.toLowerCase()}-terms-accepted`);
    resetCookiePreferences();

    // Reload the page to reset all state
    window.location.reload();
  };

  return (
    <>
      <footer className="bg-muted py-12">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-semibold mb-4">{COMPANY_NAME}</div>
              <p className="text-muted-foreground">
                The nation's fastest growing peer-to-peer rental platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Rent</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="/browse"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse listings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Weddings & events
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Host</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="/upload"
                    className="hover:text-foreground transition-colors"
                  >
                    Rent your product
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Insurance
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="/faq"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0 items-center">
              <a
                href="/terms-of-service"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Policies
              </a>
              <button
                onClick={() => {
                  resetCookiePreferences();
                  window.location.reload();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Cookie Preferences
              </button>
              <Button
                onClick={handleClearCookies}
                className="bg-lime-500 hover:bg-lime-600 text-black font-semibold"
                size="sm"
              >
                Clear Cookies
              </Button>
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
}
