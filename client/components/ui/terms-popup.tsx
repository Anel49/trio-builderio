import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, FileText } from "lucide-react";
import { COMPANY_NAME } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsPopupProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function TermsCardContent({ onAccept }: { onAccept: () => void }) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">
          Welcome to {COMPANY_NAME}
        </CardTitle>
        <p className="text-muted-foreground" style={{ fontSize: "17px" }}>
          Please review our Terms of Service before continuing
        </p>
      </CardHeader>
      <CardContent>
        <div className="pr-2">
          <div className="max-h-[70vh]">
            <ScrollArea className="h-[70vh] pr-2">
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Important Safety Guidelines
                      </p>
                      <ul
                        className="text-amber-700 dark:text-amber-300 space-y-1"
                        style={{ fontSize: "15px" }}
                      >
                        <li>• Always meet in public, well-lit locations</li>
                        <li>• Verify item condition before and after rental</li>
                        <li>• Never share personal financial information</li>
                        <li>• Report any suspicious activity immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div
                  className="space-y-3 text-muted-foreground"
                  style={{ fontSize: "17px" }}
                >
                  <p>
                    By using {COMPANY_NAME}, you agree to our community
                    standards and rental policies. Our platform connects people
                    for safe, peer-to-peer item sharing.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Key Points:</h4>
                    <ul className="space-y-1 ml-2" style={{ fontSize: "15px" }}>
                      <li>• You're responsible for items while renting them</li>
                      <li>
                        • Service fees apply to all completed transactions
                      </li>
                      <li>
                        • Prohibited items include weapons and illegal
                        items and services. Please view the full Terms
                        of Service for a complete list of prohibit items.
                      </li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <p
                    className="text-muted-foreground mb-4"
                    style={{ fontSize: "15px" }}
                  >
                    Please read our full{" "}
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service here
                    </a>
                  </p>
                  <Button onClick={onAccept} className="w-full" size="lg">
                    Accept Terms of Service
                  </Button>
                </div>

                <p
                  className="text-center text-muted-foreground"
                  style={{ fontSize: "15px" }}
                >
                  By clicking "Accept", you agree to be bound by our Terms of
                  Service and Privacy Policy.
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TermsPopup({ isOpen, onAccept }: TermsPopupProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <TermsCardContent onAccept={onAccept} />
    </div>
  );
}
