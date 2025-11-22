import { Container } from "./Container";
import { resetCookiePreferences } from "@/lib/cookie-utils";
import { COMPANY_NAME } from "@/lib/constants";
import { Button } from "./ui/button";

export function Footer() {
  const handleClearCookies = () => {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    resetCookiePreferences();
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
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
}
