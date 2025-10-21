import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart } from "lucide-react";
import { useEffect } from "react";

interface AddToFavoritesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingName: string;
}

export function AddToFavoritesModal({
  isOpen,
  onOpenChange,
  listingName,
}: AddToFavoritesModalProps) {
  // Auto close after 2 seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onOpenChange(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOpen, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-3">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            </div>
          </div>
          <DialogTitle className="text-center">Added to Favorites</DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium">{listingName}</span> has been added to
            your favorites.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
