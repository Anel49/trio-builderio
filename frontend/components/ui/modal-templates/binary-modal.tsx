import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BinaryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary?: () => void | Promise<void>;
  onSecondary?: () => void;
  primaryLoading?: boolean;
  secondaryLoading?: boolean;
  isDangerous?: boolean;
  centered?: boolean;
}

export function BinaryModal({
  isOpen,
  onOpenChange,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryLoading = false,
  secondaryLoading = false,
  isDangerous = false,
  centered = false,
}: BinaryModalProps) {
  const [isPrimaryLoading, setIsPrimaryLoading] = useState(false);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);

  const handlePrimary = async () => {
    if (isPrimaryLoading || isSecondaryLoading || primaryLoading) return;

    setIsPrimaryLoading(true);
    try {
      if (onPrimary) {
        await onPrimary();
      }
      onOpenChange(false);
    } finally {
      setIsPrimaryLoading(false);
    }
  };

  const handleSecondary = async () => {
    if (isPrimaryLoading || isSecondaryLoading || secondaryLoading) return;

    setIsSecondaryLoading(true);
    try {
      if (onSecondary) {
        await onSecondary();
      }
      onOpenChange(false);
    } finally {
      setIsSecondaryLoading(false);
    }
  };

  const isAnyLoading =
    isPrimaryLoading ||
    isSecondaryLoading ||
    primaryLoading ||
    secondaryLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <div>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-2">
          <Button
            onClick={handleSecondary}
            disabled={isAnyLoading}
            variant="outline"
            className="w-full"
          >
            {isSecondaryLoading || secondaryLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {secondaryLabel}
          </Button>
          <Button
            onClick={handlePrimary}
            disabled={isAnyLoading}
            variant={isDangerous ? "destructive" : "default"}
            className="w-full"
          >
            {isPrimaryLoading || primaryLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {primaryLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
