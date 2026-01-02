import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PendingIdentityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingIdentityModal({
  isOpen,
  onOpenChange,
}: PendingIdentityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pending identity verification</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Your account is pending identity verification. We use identity
              checks to keep our users and communities safe. You can still edit
              your profile, message users, and favorite listings, but you cannot
              create listings, make reservations, or leave reviews. You will be
              notified via email once your account is verified.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              OK
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
