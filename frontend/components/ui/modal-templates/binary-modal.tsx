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
    isPrimaryLoading || isSecondaryLoading || primaryLoading || secondaryLoading;

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
        <DialogFooter
          className={combineTokens(
            "flex-col-reverse sm:flex-row",
            "gap-3 sm:gap-2"
          )}
        >
          <Button
            onClick={handleSecondary}
            disabled={isAnyLoading}
            variant="outline"
            className="w-full sm:w-auto"
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
            className="w-full sm:w-auto"
          >
            {isPrimaryLoading || primaryLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
