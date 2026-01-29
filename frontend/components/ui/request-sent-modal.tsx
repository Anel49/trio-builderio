import { ConfirmationModal } from "@/components/ui/modal-templates";

interface RequestSentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestSentModal({
  open,
  onOpenChange,
}: RequestSentModalProps) {
  return (
    <ConfirmationModal
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Request sent"
      confirmLabel="Got it"
      onConfirm={() => onOpenChange(false)}
    >
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
    </ConfirmationModal>
  );
}
