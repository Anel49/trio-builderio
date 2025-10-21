import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface Favorite {
  id: number;
  name: string;
  price: string;
  rating: number | null;
  image: string;
  host: string;
  type: string;
  rentalPeriod?: string;
  favoritedAt?: string;
}

interface FavoritesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function FavoritesModal({
  isOpen,
  onOpenChange,
  userId,
}: FavoritesModalProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`favorites/${userId}`);
        const data = await response.json().catch(() => ({}));
        if (data.ok) {
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isOpen, userId]);

  // Auto close confirmation modal after 2 seconds
  useEffect(() => {
    if (showConfirmation && justAdded) {
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation, justAdded]);

  const handleRemoveFavorite = async (listingId: number) => {
    if (!userId) return;

    try {
      const response = await apiFetch(
        `favorites/${userId}/${listingId}`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (data.ok) {
        setFavorites(favorites.filter((f) => f.id !== listingId));
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  };

  // Show confirmation modal when just added
  if (showConfirmation && justAdded) {
    return (
      <Dialog open={isOpen && showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-50 dark:bg-red-900/20 p-3">
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              </div>
            </div>
            <DialogTitle className="text-center">Added to Favorites</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium">{justAdded}</span> has been added to
              your favorites.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Show favorites list
  return (
    <Dialog open={isOpen && !showConfirmation} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>My Favorites</DialogTitle>
          <DialogDescription>
            {favorites.length === 0
              ? "You haven't added any favorites yet"
              : `You have ${favorites.length} favorite${favorites.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="relative h-8 w-8 mx-auto mb-2">
                <div className="absolute inset-0 rounded-full border-2 border-muted"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
              </div>
              <p className="text-sm text-muted-foreground">Loading favorites...</p>
            </div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Start adding your favorite items!
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-2">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {favorite.image && (
                  <img
                    src={favorite.image}
                    alt={favorite.name}
                    className="h-20 w-20 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium line-clamp-1">{favorite.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    by {favorite.host}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold">{favorite.price}</span>
                    {favorite.rentalPeriod && (
                      <span className="text-xs text-muted-foreground">
                        per {favorite.rentalPeriod.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {favorite.rating && (
                    <p className="text-xs text-muted-foreground">
                      ★ {favorite.rating}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Remove from favorites"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
