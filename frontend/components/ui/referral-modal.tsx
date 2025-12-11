import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReferralModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFindUser?: (username: string) => void;
  onNoReferrer?: () => void;
}

export function ReferralModal({
  isOpen,
  onOpenChange,
  onFindUser,
  onNoReferrer,
}: ReferralModalProps) {
  const [username, setUsername] = useState("");

  const handleFindUser = () => {
    if (onFindUser) {
      onFindUser(username);
    }
  };

  const handleNoReferrer = () => {
    onOpenChange(false);
    if (onNoReferrer) {
      onNoReferrer();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Referral
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <DialogDescription className="text-center text-base text-foreground">
            If you were referred by an existing user, please enter the referring
            user's username below.
          </DialogDescription>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
            />

            <div className="flex gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleFindUser}
              >
                Find user
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleNoReferrer}
              >
                No referrer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
