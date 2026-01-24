import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  spacing,
  typography,
  layouts,
  combineTokens,
} from "@/lib/design-tokens";

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  duration?: number;
}

export function SuccessModal({
  isOpen,
  onOpenChange,
  title,
  description,
  icon,
  duration = 2000,
}: SuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onOpenChange(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, onOpenChange, duration]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={combineTokens(
          "flex flex-col items-center justify-center",
          spacing.padding.card
        )}
      >
        <DialogHeader
          className={combineTokens(
            "flex flex-col items-center space-y-4",
            "text-center"
          )}
        >
          {icon || <CheckCircle2 className="h-12 w-12 text-green-500" />}
          <DialogTitle className={typography.combinations.heading}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={typography.combinations.body}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
