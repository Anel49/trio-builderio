import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RequestSentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestSentModal({
  open,
  onOpenChange,
}: RequestSentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Sent</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-muted-foreground">
            Your reservation request has been submitted! You will be notified by
            email when the status of your request changes.{" "}
            <a
              href="/rentals-and-requests?tab=requests"
              className="text-primary hover:underline"
            >
              Click here
            </a>{" "}
            to see your recent requests.
          </p>
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
