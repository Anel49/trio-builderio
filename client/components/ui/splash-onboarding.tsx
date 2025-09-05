import { useEffect, useState } from "react";
import { COMPANY_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TermsContent } from "@/components/ui/legal-modal";

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
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="relative flex flex-col min-h-screen">
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Welcome to {COMPANY_NAME}!</h1>
              <p className="text-muted-foreground text-lg md:text-xl mb-10 text-center max-w-2xl">
                A simple, community-driven way to rent and share items and services nearby.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl items-start">
                <div>
                  <h2 className="text-2xl font-semibold mb-3">Hosts</h2>
                  <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                    <li>Choose an item or service</li>
                    <li>Enter listing details</li>
                    <li>Post</li>
                  </ol>
                </div>
                <div className="hidden md:block h-full w-px bg-border mx-auto" aria-hidden />
                <div className="md:col-start-2">
                  <h2 className="text-2xl font-semibold mb-3">Renters</h2>
                  <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                    <li>Search for an item or service</li>
                    <li>Add a date range (optional)</li>
                    <li>Reserve</li>
                  </ol>
                </div>
              </div>

              <div className="mt-10">
                <Button size="lg" onClick={() => setStep(2)}>Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl items-start">
                <div>
                  <h2 className="text-2xl font-semibold mb-3">Hosts</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Profits from listings incur a 12% platform usage fee. This rate is subject to change based on the platform’s performance and growth. Sales tax is charged separately.
                  </p>
                </div>
                <div className="hidden md:block h-full w-px bg-border mx-auto" aria-hidden />
                <div className="md:col-start-2">
                  <h2 className="text-2xl font-semibold mb-3">Renters</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>Please take care of the items you rent as if they were your own.</p>
                    <p>
                      Item rentals incur a 10% fee of the item’s daily rental price to insure the renter throughout the rental period. This fee is not charged again with rental extensions. The renter's maximum out-of-pocket insurance payment is capped at $50. This coverage is subject to change based on the platform’s performance and growth.
                    </p>
                    <p>Listings providing a service do not incur this fee.</p>
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <Button size="lg" onClick={() => setStep(3)}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="h-full flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-6">Terms of Service</h2>
              <div className="w-full max-w-5xl border rounded-lg">
                <ScrollArea className="h-[50vh] p-6">
                  <div className="space-y-6">
                    <TermsContent />
                  </div>
                </ScrollArea>
              </div>
              <div className="mt-6">
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
        </div>
      </div>
    </div>
  );
}

export default SplashOnboarding;
