import { useEffect, useState } from "react";
import { COMPANY_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TermsContent } from "@/components/ui/legal-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function SplashOnboarding() {
  const STORAGE_KEY = `${COMPANY_NAME.toLowerCase()}-splash-completed`;
  const TERMS_KEY = `${COMPANY_NAME.toLowerCase()}-terms-accepted`;
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY) === "true";
    if (!completed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <Dialog open={visible}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
        {step === 1 && (
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center">Welcome to {COMPANY_NAME}!</h1>
            <p className="text-muted-foreground text-base md:text-lg mb-6 text-center max-w-2xl mx-auto">
              A simple, community-driven way to rent and share items and services nearby.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
              <div>
                <h2 className="text-xl font-semibold mb-3">Hosts</h2>
                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                  <li>Choose an item or service</li>
                  <li>Enter listing details</li>
                  <li>Post</li>
                </ol>
              </div>
              <div className="hidden md:block h-full w-px bg-border mx-auto" aria-hidden />
              <div>
                <h2 className="text-xl font-semibold mb-3">Renters</h2>
                <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                  <li>Search for an item or service</li>
                  <li>Add a date range (optional)</li>
                  <li>Reserve</li>
                </ol>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button size="lg" onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
              <div>
                <h2 className="text-xl font-semibold mb-3">Hosts</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Profits from listings incur a 12% platform usage fee. This rate is subject to change based on the platform’s performance and growth. Sales tax is charged separately.
                </p>
              </div>
              <div className="hidden md:block h-full w-px bg-border mx-auto" aria-hidden />
              <div>
                <h2 className="text-xl font-semibold mb-3">Renters</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p><strong>Please take care of the items you rent as if they were your own.</strong></p>
                  <p>
                    Item rentals incur a 10% fee of the item’s daily rental price to insure the renter throughout the rental period. This fee is not charged again with rental extensions. The renter's maximum out-of-pocket insurance payment is capped at $50. This coverage is subject to change based on the platform’s performance and growth.
                  </p>
                  <p>Listings providing a service do not incur this fee.</p>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Terms of Service</h2>
            <div className="border rounded-lg">
              <ScrollArea className="h-80 p-6">
                <div className="space-y-6">
                  <TermsContent />
                </div>
              </ScrollArea>
            </div>
            <div className="mt-6 text-center">
              <Button
                size="lg"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, "true");
                  localStorage.setItem(TERMS_KEY, "true");
                  setVisible(false);
                }}
              >
                Get started
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SplashOnboarding;
