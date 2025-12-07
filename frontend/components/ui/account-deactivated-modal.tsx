import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COMPANY_EMAIL } from "@/lib/constants";

interface AccountDeactivatedModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountDeactivatedModal({
  open,
  onClose,
}: AccountDeactivatedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Activation</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-base">
          Your account is inactive. To reactivate it, please contact support at{" "}
          <a href={`mailto:${COMPANY_EMAIL}`} className="text-primary hover:underline font-medium">
            {COMPANY_EMAIL}
          </a>
          .
        </DialogDescription>
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
