import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface AddToFavoritesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listingName: string;
  onSeeFavorites?: () => void;
}

export function AddToFavoritesModal({
  isOpen,
  onOpenChange,
  listingName,
  onSeeFavorites,
}: AddToFavoritesModalProps) {
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
      </DialogContent>
    </Dialog>
  );
}
