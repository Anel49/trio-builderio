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
import { RENTER_FEE, SUBSEQUENT_DAILY_FEE } from "@/lib/constants";

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
  const [showListingInsuranceModal, setShowListingInsuranceModal] =
    useState(false);

  // Calculate listing insurance: RENTER_FEE% for first day + SUBSEQUENT_DAILY_FEE% for subsequent days
  const listingInsuranceFirstDay = Math.round(
    dailyPrice * (RENTER_FEE / 100)
  );
  const listingInsuranceSubsequentDays =
    totalDays > 1
      ? Math.round(
          dailyPrice * (SUBSEQUENT_DAILY_FEE / 100) * (totalDays - 1)
        )
      : 0;
  const listingInsuranceTotal =
    listingInsuranceFirstDay + listingInsuranceSubsequentDays;

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
      // Non-consumable addons: RENTER_FEE% first day + SUBSEQUENT_DAILY_FEE% per subsequent day
      const firstDayFee = Math.round(addon.price * (RENTER_FEE / 100));
      const subsequentDaysFee =
        totalDays > 1
          ? Math.round(addon.price * (SUBSEQUENT_DAILY_FEE / 100) * (totalDays - 1))
          : 0;
      const totalFee = firstDayFee + subsequentDaysFee;
      return { addon, fee: totalFee };
    }
  });

  // Insurance fees for non-consumable addons
  const nonConsumableInsuranceTotal = addonFees.reduce((sum, item) => {
    if (!item.addon.consumable && item.addon.price !== null) {
      return sum + item.fee;
    }
    return sum;
  }, 0);

  // Original prices of non-consumable addons (from host)
  const nonConsumableAddonPrices = selectedAddons.reduce((sum, addon) => {
    if (!addon.consumable && addon.price !== null) {
      return sum + addon.price;
    }
    return sum;
  }, 0);

  // Consumable addon costs (price × qty)
  const consumableTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.consumable && addon.price !== null) {
      return sum + addon.price * (addon.qty || 0);
    }
    return sum;
  }, 0);

  // Total addon cost: consumable costs + non-consumable prices + insurance
  const addonTotal =
    consumableTotal + nonConsumableAddonPrices + nonConsumableInsuranceTotal;
  const dailyTotal = dailyPrice * totalDays;
  const finalTotal =
    dailyTotal + listingInsuranceTotal + addonTotal;

  // Check if there are any non-consumable addons selected
  const hasNonConsumableAddons = selectedAddons.some(
    (addon) => !addon.consumable && addon.price !== null,
  );

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
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
                <p className="text-sm font-semibold">
                  {formatPrice(dailyTotal)}
                </p>
              </div>
            </div>

            {/* Listing Insurance */}
            <div className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">Listing insurance</p>
                  <button
                    type="button"
                    onClick={() => setShowListingInsuranceModal(true)}
                    className="p-0 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Information about listing insurance"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold">
                  {formatPrice(listingInsuranceTotal)}
                </p>
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
                        {addon.consumable &&
                          addon.qty &&
                          addon.qty > 1 &&
                          ` × ${addon.qty}`}
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

                {/* Addon Insurance Row - Only show if non-consumable addons exist */}
                {hasNonConsumableAddons && (
                  <div className="flex justify-between items-center text-sm pt-2 pb-2 border-t">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Addon insurance
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddonFeesModal(true)}
                        className="p-0 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Information about addon insurance"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(nonConsumableInsuranceTotal)}
                    </span>
                  </div>
                )}

              </div>
            )}

            {/* Subtotal and Tax */}
            <div className="pb-3 border-b space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Subtotal:</p>
                <p className="text-sm font-semibold">
                  {formatPrice(finalTotal)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Tax:</p>
                <p className="text-sm font-semibold">
                  {formatPrice(0)}
                </p>
              </div>
            </div>

            {/* Final Total */}
            <div className="bg-accent p-3 rounded-md">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">Booking subtotal</p>
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

      <ConfirmationModal
        isOpen={showAddonFeesModal}
        onOpenChange={setShowAddonFeesModal}
        title="Addon insurance"
        confirmLabel="Got it"
        onConfirm={() => setShowAddonFeesModal(false)}
      >
        <p className="text-sm text-muted-foreground">
          When renting a non-consumable addon, you will be charged {RENTER_FEE}% of the
          addon's cost for the first day and {SUBSEQUENT_DAILY_FEE}% per subsequent day to insure
          that addon throughout the duration of your rental. Extensions of this
          order will only be charged {SUBSEQUENT_DAILY_FEE}% per extended day for the addon(s) chosen.
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Consumable addons cannot be insured and thus are not charged an
          insurance fee.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={showListingInsuranceModal}
        onOpenChange={setShowListingInsuranceModal}
        title="Listing insurance"
        confirmLabel="Got it"
        onConfirm={() => setShowListingInsuranceModal(false)}
      >
        <p className="text-sm text-muted-foreground">
          When booking a listing, you will be charged {RENTER_FEE}% of the listing's daily
          rate for the first day and {SUBSEQUENT_DAILY_FEE}% per subsequent day to insure the listing's
          item(s) throughout the duration of your rental. Extensions of this order
          will only be charged {SUBSEQUENT_DAILY_FEE}% of the daily rate per extended day.
        </p>
      </ConfirmationModal>
    </>
  );
}
