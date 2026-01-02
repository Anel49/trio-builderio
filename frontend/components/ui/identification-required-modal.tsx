import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IdentificationRequiredModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdentificationRequiredModal({
  isOpen,
  onOpenChange,
}: IdentificationRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Identification required</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Identity verification has not been started for this account. Until
              your identity is verified, you cannot create listings, make
              reservations, or leave reviews. To begin verification, go to your
              account, select "Identify me" under your profile picture, and
              follow the instructions.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              OK
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
