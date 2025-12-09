import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMPANY_NAME } from "@/lib/constants";

interface BankingSetupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankingSetupModal({
  isOpen,
  onOpenChange,
}: BankingSetupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Banking setup incomplete</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-foreground">
            In order to create a listing, you are required to configure your
            bank information so that {COMPANY_NAME} can issue your earnings. To
            complete this process, navigate to your profile page and click or
            tap the "Setup payouts" button located beneath your profile picture.
          </p>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
