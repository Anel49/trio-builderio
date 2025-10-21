import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeartCrack } from "lucide-react";
import { useEffect } from "react";

interface RemoveFromFavoritesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingName: string;
  onSeeFavorites?: () => void;
  showButtons?: boolean;
  hideDelay?: number;
}

export function RemoveFromFavoritesModal({
  isOpen,
  onOpenChange,
  listingName,
  onSeeFavorites,
  showButtons = true,
  hideDelay,
}: RemoveFromFavoritesModalProps) {
  useEffect(() => {
    if (!isOpen || !hideDelay) return;

    const timer = setTimeout(() => {
      onOpenChange(false);
    }, hideDelay);

    return () => clearTimeout(timer);
  }, [isOpen, hideDelay, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-3">
              <HeartCrack className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <DialogTitle className="text-center">
            Removed from Favorites
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium">{listingName}</span> has been removed
            from your favorites.
          </DialogDescription>
        </DialogHeader>
        {showButtons && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => {
                onSeeFavorites?.();
                onOpenChange(false);
              }}
              className="flex-1"
            >
              See Favorites
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
