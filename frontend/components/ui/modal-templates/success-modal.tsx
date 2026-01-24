import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="max-w-sm flex flex-col items-center justify-center">
        <DialogHeader className="flex flex-col items-center space-y-4 text-center">
          {icon || <CheckCircle2 className="h-12 w-12 text-green-500" />}
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-base text-muted-foreground">{description}</p>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
