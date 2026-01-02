import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COMPANY_EMAIL } from "@/lib/constants";

interface AccountDeactivatedModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDeactivatedModal({
  isOpen,
  onOpenChange,
}: AccountDeactivatedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account deactivated</DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This account has been deactivated. If you believe this action was
              taken in error, require additional information regarding the
              deactivation, or wish to appeal the decision, please contact us at{" "}
              <a
                href={`mailto:${COMPANY_EMAIL}`}
                className="text-primary hover:underline"
              >
                {COMPANY_EMAIL}
              </a>{" "}
              using the email address associated with the account.
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
