import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  isDangerous?: boolean;
  centered?: boolean;
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
  centered = false,
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <div>
            <p className={`text-base text-muted-foreground ${centered ? "text-center" : ""}`}>{description}</p>
          </div>
        )}
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          variant={isDangerous ? "destructive" : "default"}
          className="w-full"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
