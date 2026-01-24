import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface LoadingModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  text?: string;
  isDismissible?: boolean;
}

export function LoadingModal({
  isOpen,
  onOpenChange,
  text,
  isDismissible = false,
}: LoadingModalProps) {
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if isDismissible is true
    if (!open && !isDismissible) {
      return;
    }
    onOpenChange?.(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm flex flex-col items-center justify-center gap-4">
        {/* Hide close button by default, show only if dismissible */}
        {!isDismissible && (
          <div className="absolute right-4 top-4 opacity-0 pointer-events-none">
            <DialogClose />
          </div>
        )}
        {isDismissible && <DialogClose />}

        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        {text && <p className="text-base text-muted-foreground">{text}</p>}
      </DialogContent>
    </Dialog>
  );
}
