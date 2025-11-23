import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export interface BookingSummaryAddon {
  id: number;
  item: string;
  style: string | null;
  price: number | null;
  consumable: boolean;
  qty?: number;
}

interface BookingSummaryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date | null;
  endDate: Date | null;
  dailyPrice: number;
  totalDays: number;
  selectedAddons: BookingSummaryAddon[];
  onConfirm: () => void;
  onBack?: () => void;
}

export function BookingSummaryModal({
  isOpen,
  onOpenChange,
  startDate,
  endDate,
  dailyPrice,
  totalDays,
  selectedAddons,
  onConfirm,
  onBack,
}: BookingSummaryModalProps) {
  // Calculate addon totals
  const consumableTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.consumable && addon.price !== null) {
      return sum + addon.price * (addon.qty || 0);
    }
    return sum;
  }, 0);

  const nonConsumableTotal = selectedAddons.reduce((sum, addon) => {
    if (!addon.consumable && addon.price !== null) {
      return sum + addon.price;
    }
    return sum;
  }, 0);

  const addonTotal = consumableTotal + nonConsumableTotal;
  const dailyTotal = dailyPrice * totalDays;
  const finalTotal = dailyTotal + addonTotal;

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dates Selected */}
          <div className="pb-3 border-b">
            <p className="text-sm font-medium">Date(s) selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              {startDate && endDate
                ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                : "No dates selected"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDays} {totalDays === 1 ? "day" : "days"}
            </p>
          </div>

          {/* Daily Total */}
          <div className="pb-3 border-b">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Daily total</p>
              <p className="text-sm">
                {formatPrice(dailyPrice)} × {totalDays}{" "}
                {totalDays === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-medium"></p>
              <p className="text-sm font-semibold">{formatPrice(dailyTotal)}</p>
            </div>
          </div>

          {/* Addon Total - Only show if addons are selected */}
          {selectedAddons.length > 0 && (
            <div className="pb-3 border-b">
              <p className="text-sm font-medium mb-2">Addons</p>
              <div className="space-y-1 mb-2">
                {selectedAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-muted-foreground">
                      {addon.item}
                      {addon.style && ` (${addon.style})`}
                      {addon.consumable && addon.qty && ` × ${addon.qty}`}
                    </span>
                    {addon.price !== null ? (
                      <span>
                        {addon.consumable && addon.qty
                          ? formatPrice(addon.price * addon.qty)
                          : formatPrice(addon.price)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Free
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm font-medium">Addon total</p>
                <p className="text-sm font-semibold">
                  {formatPrice(addonTotal)}
                </p>
              </div>
            </div>
          )}

          {/* Final Total */}
          <div className="bg-accent p-3 rounded-md">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-lg font-bold text-primary">
                {formatPrice(finalTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onConfirm} className="flex-1">
            Confirm reservation
          </Button>
          <Button
            variant="outline"
            onClick={onBack || (() => onOpenChange(false))}
            className="flex-1"
          >
            {onBack ? "Back" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
