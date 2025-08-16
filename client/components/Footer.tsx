import { useState } from "react";
import { Container } from "./Container";
import { PrivacyModal } from "./ui/privacy-modal";
import { CookiesModal } from "./ui/cookies-modal";

export function Footer() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isCookiesModalOpen, setIsCookiesModalOpen] = useState(false);

  return (
    <>
      <footer className="bg-muted py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-semibold mb-4">Trio</div>
              <p className="text-muted-foreground">
                The nation's largest rental marketplace.
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
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help center
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
              © 2025 Trio. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/terms-of-service"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Policies
              </a>
            </div>
          </div>
        </Container>
      </footer>

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onOpenChange={setIsPrivacyModalOpen}
      />
      <CookiesModal
        isOpen={isCookiesModalOpen}
        onOpenChange={setIsCookiesModalOpen}
      />
    </>
  );
}
