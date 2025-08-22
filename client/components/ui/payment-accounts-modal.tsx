import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

interface PaymentAccountsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentAccountsModal({
  isOpen,
  onOpenChange,
}: PaymentAccountsModalProps) {
  const handlePaymentConnect = (provider: string) => {
    // This would integrate with actual OAuth providers
    alert(`Connecting to ${provider}... (Demo mode)`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Payment Accounts</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 pb-4">
            {/* Safety Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  We do not save charge card or bank information for your
                  safety. If you want a quick way to send and receive payments,
                  please use the following third-parties.
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePaymentConnect("PayPal")}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0070ba">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l1.506-9.587-.506.062h2.19c4.638 0 7.709-1.89 8.638-6.699.015-.076.025-.175.038-.26a3.35 3.35 0 0 0-.607.541z" />
                    </svg>
                    <span>PayPal</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePaymentConnect("Apple Pay")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-black dark:bg-white rounded flex items-center justify-center">
                      <span className="text-white dark:text-black text-xs font-bold">A</span>
                    </div>
                    <span>Apple Pay</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePaymentConnect("Google Pay")}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Google Pay</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePaymentConnect("Venmo")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">V</span>
                    </div>
                    <span>Venmo</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePaymentConnect("Cash App")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">$</span>
                    </div>
                    <span>Cash App</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handlePaymentConnect("Zelle")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Z</span>
                    </div>
                    <span>Zelle</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
