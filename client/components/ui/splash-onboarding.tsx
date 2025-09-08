import { useEffect, useState } from "react";
import { COMPANY_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TermsCardContent } from "@/components/ui/terms-popup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      {step === 1 && (
        <div className="w-full max-w-md mx-4">
          <Card className="w-full max-w-md mx-auto shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">
                Welcome to {COMPANY_NAME}!
              </CardTitle>
              <p className="text-muted-foreground">
                {COMPANY_NAME} is a safe and reliable way to rent with peers.
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Hosts</h2>
                    <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                      <li>Choose an item or service</li>
                      <li>Enter listing details</li>
                      <li>Post</li>
                    </ol>
                  </div>
                  <Separator />
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Renters</h2>
                    <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                      <li>Search for an item or service</li>
                      <li>Add a date range (optional)</li>
                      <li>Reserve</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button size="lg" onClick={() => setStep(2)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-md mx-4">
          <Card className="w-full max-w-md mx-auto shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold">
                Before you continue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh] pr-2">
                <div className="space-y-6 text-muted-foreground">
                  <div>
                    <h2 className="text-lg font-semibold mb-3 text-foreground">
                      Hosts
                    </h2>
                    <p className="leading-relaxed">
                      Profits from listings incur a 12% platform usage fee. This
                      rate is subject to change based on the platform’s
                      performance and growth. Sales tax is charged separately.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h2 className="text-lg font-semibold mb-3 text-foreground">
                      Renters
                    </h2>
                    <div className="space-y-4 leading-relaxed">
                      <p>
                        <strong className="text-foreground">
                          Please take care of the items you rent as if they were
                          your own.
                        </strong>
                      </p>
                      <p>
                        Item rentals incur a 10% fee of the item’s daily rental
                        price to insure the renter throughout the rental period.
                        This fee is not charged again with rental extensions.
                        The renter's maximum out-of-pocket insurance payment is
                        capped at $50. This coverage is subject to change based
                        on the platform’s performance and growth.
                      </p>
                      <p>Listings providing a service do not incur this fee.</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="mt-6 text-center">
                <Button size="lg" onClick={() => setStep(3)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-md mx-4">
          <TermsCardContent
            onAccept={() => {
              localStorage.setItem(STORAGE_KEY, "true");
              localStorage.setItem(TERMS_KEY, "true");
              setVisible(false);
              window.dispatchEvent(new CustomEvent("trio-terms-accepted"));
            }}
          />
        </div>
      )}
    </div>
  );
}

export default SplashOnboarding;
