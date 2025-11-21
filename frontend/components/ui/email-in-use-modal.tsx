import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMPANY_EMAIL } from "@/lib/constants";

interface EmailInUseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function EmailInUseModal({
  isOpen,
  onOpenChange,
  email,
}: EmailInUseModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Email in use
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <p className="text-muted-foreground text-sm">
            An account associated with the email address <strong>{email}</strong>{" "}
            already exists. The account creation process has been cancelled. If
            you believe this is an error, please send us an email at{" "}
            <a
              href={`mailto:${COMPANY_EMAIL}`}
              className="text-primary hover:underline"
            >
              {COMPANY_EMAIL}
            </a>
            .
          </p>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
