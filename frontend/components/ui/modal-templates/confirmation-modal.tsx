import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  isDangerous?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "OK",
  onConfirm,
  loading = false,
  isDangerous = false,
}: ConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading || isLoading) return;

    setIsLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isProcessing = loading || isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={spacing.padding.card}>
        <DialogHeader>
          <DialogTitle className={typography.combinations.heading}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={typography.combinations.body}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            variant={isDangerous ? "destructive" : "default"}
            className={combineTokens("w-full sm:w-auto")}
          >
            {isProcessing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
