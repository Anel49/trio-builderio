import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationModal } from "@/components/ui/modal-templates";
import { Info } from "lucide-react";
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
  const [showAddonFeesModal, setShowAddonFeesModal] = useState(false);

  // Calculate addon fees with new pricing plan
  // Non-consumable: 10% for first day + 1.5% for subsequent days
  // Consumable: No charge

  const addonFees = selectedAddons.map((addon) => {
    if (addon.price === null) {
      return { addon, fee: 0 };
    }

    if (addon.consumable) {
      // Consumable addons: no charge
      return { addon, fee: 0 };
    } else {
      // Non-consumable addons: 10% first day + 1.5% per subsequent day
      const firstDayFee = Math.round(addon.price * 0.10);
      const subsequentDaysFee =
        totalDays > 1
          ? Math.round(addon.price * 0.015 * (totalDays - 1))
          : 0;
      const totalFee = firstDayFee + subsequentDaysFee;
      return { addon, fee: totalFee };
    }
  });

  const nonConsumableTotal = addonFees.reduce((sum, item) => {
    if (!item.addon.consumable && item.addon.price !== null) {
      return sum + item.fee;
    }
    return sum;
  }, 0);

  const consumableTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.consumable && addon.price !== null) {
      return sum + addon.price * (addon.qty || 0);
    }
    return sum;
  }, 0);

  const addonTotal = consumableTotal + nonConsumableTotal;
  const dailyTotal = dailyPrice * totalDays;
  const finalTotal = dailyTotal + addonTotal;

  // Check if there are any non-consumable addons selected
  const hasNonConsumableAddons = selectedAddons.some(
    (addon) => !addon.consumable && addon.price !== null
  );

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
                {addonFees.map((item) => {
                  const { addon, fee } = item;
                  return (
                    <div
                      key={addon.id}
                      className="text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {addon.item}
                          {addon.style && ` (${addon.style})`}
                          {addon.consumable && addon.qty && ` × ${addon.qty}`}
                        </span>
                        {addon.price !== null ? (
                          <span>
                            {addon.consumable && addon.qty
                              ? formatPrice(addon.price * addon.qty)
                              : !addon.consumable
                                ? formatPrice(fee)
                                : formatPrice(0)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Free
                          </span>
                        )}
                      </div>
                      {!addon.consumable && addon.price !== null && (
                        <div className="text-xs text-muted-foreground mt-0.5 ml-2">
                          {totalDays === 1
                            ? `10% of $${(addon.price / 100).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                            : `10% 1st day + 1.5% ×${totalDays - 1} days`}
                        </div>
                      )}
                    </div>
                  );
                })}
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
