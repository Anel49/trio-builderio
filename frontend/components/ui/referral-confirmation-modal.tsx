import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReferralConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGoBack: () => void;
  onNoReferrer: () => void;
}

export function ReferralConfirmationModal({
  isOpen,
  onOpenChange,
  onGoBack,
  onNoReferrer,
}: ReferralConfirmationModalProps) {
  const handleClose = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  };

  const handleGoBack = () => {
    onOpenChange(false);
    onGoBack();
  };

  const handleNoReferrer = async () => {
    await onNoReferrer();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Referral confirmation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-0">
          <p className="text-base text-foreground">
            Please confirm that you were not referred by another user.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleGoBack}>
              Go back
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handleNoReferrer}
            >
              No referrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
