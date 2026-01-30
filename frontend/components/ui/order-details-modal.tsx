import React, { useState } from "react";
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
import {
  extractTimezoneName,
  getTimezoneName,
} from "@/lib/timezone-utils";

// Utility to parse dates without timezone conversion
const parseDateString = (dateStr: string): Date => {
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

// Format timestamp to listing timezone in "January 1, 2026 10:32 PM" format
function formatTimestampInTimezone(
  createdAtStr: string,
  timezone: string | null,
): string {
  try {
    const date = new Date(createdAtStr);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone || "UTC",
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (e) {
    console.error("[OrderDetailsModal] Error formatting timestamp:", e);
    return createdAtStr;
  }
}

// Parse addons from JSON string
interface ParsedAddon {
  name: string;
  style: string | null;
  price: number;
  consumable: boolean;
  qty?: number;
}

function parseOrderAddons(addonsJson: string | null): ParsedAddon[] {
  const addonsArray: ParsedAddon[] = [];
  if (!addonsJson) return addonsArray;

  try {
    const parsedAddons = JSON.parse(addonsJson);
    if (typeof parsedAddons === "object" && parsedAddons !== null) {
      Object.entries(parsedAddons).forEach(([itemName, value]: [string, any]) => {
        if (Array.isArray(value) && value.length >= 3) {
          const [style, price, consumableStr, qty] = value;
          addonsArray.push({
            name: itemName,
            style: style === "null" ? null : style,
            price: typeof price === "number" ? price : 0,
            consumable: consumableStr === "true",
            qty: typeof qty === "number" ? qty : 1,
          });
        }
      });
    }
  } catch (e) {
    console.error("[OrderDetailsModal] Failed to parse addons:", e);
  }

  return addonsArray;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function OrderDetailsModal({
  isOpen,
  onOpenChange,
  order,
}: OrderDetailsModalProps) {
  const [showListingInsuranceModal, setShowListingInsuranceModal] =
    useState(false);
  const [showAddonInsuranceModal, setShowAddonInsuranceModal] = useState(false);

  if (!order) return null;

  // Parse addons
  const parsedAddons = parseOrderAddons(order.addons);
  const nonconsumableAddons = parsedAddons.filter((addon) => !addon.consumable);

  // Calculate totals
  const dailyPrice = order.daily_price_cents || 0;
  const totalDays = order.total_days || 0;
  const dailyTotal = dailyPrice * totalDays;

  // Listing insurance: 10% first day + 1.5% per subsequent day
  const listingInsuranceFirstDay = Math.round(dailyPrice * (RENTER_FEE / 100));
  const listingInsuranceSubsequentDays =
    totalDays > 1
      ? Math.round(dailyPrice * (SUBSEQUENT_DAILY_FEE / 100) * (totalDays - 1))
      : 0;
  const listingInsuranceTotal =
    listingInsuranceFirstDay + listingInsuranceSubsequentDays;

  // Non-consumable addon prices and insurance
  const nonConsumableAddonPrices = nonconsumableAddons.reduce((sum, addon) => {
    return sum + addon.price * (addon.qty || 1);
  }, 0);

  const nonConsumableAddonInsurance = nonconsumableAddons.reduce((sum, addon) => {
    const addonTotal = addon.price * (addon.qty || 1);
    const firstDayFee = Math.round(addonTotal * (RENTER_FEE / 100));
    const subsequentDaysFee =
      totalDays > 1
        ? Math.round(addonTotal * (SUBSEQUENT_DAILY_FEE / 100) * (totalDays - 1))
        : 0;
    return sum + firstDayFee + subsequentDaysFee;
  }, 0);

  // Consumable addon costs
  const consumableTotal = parsedAddons.reduce((sum, addon) => {
    if (addon.consumable && addon.price) {
      return sum + addon.price * (addon.qty || 1);
    }
    return sum;
  }, 0);

  // Total addon cost: consumable + non-consumable + insurance
  const addonTotal =
    consumableTotal + nonConsumableAddonPrices + nonConsumableAddonInsurance;

  // Final subtotal (tax calculated separately)
  const bookingSubtotal =
    dailyTotal + listingInsuranceTotal + addonTotal;

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-[11in] print:h-[11in] print:m-0 print:p-0 print:border-0 print:shadow-none print:overflow-hidden">
          <style>{`
            @media print {
              @page {
                size: letter;
                margin: 0.5in;
              }

              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background: white;
                color: black;
              }

              * {
                background: transparent !important;
                color: black !important;
                box-shadow: none !important;
                border-color: black !important;
              }

              [role="dialog"],
              [role="alertdialog"] {
                all: revert;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                max-width: 100% !important;
                max-height: 100% !important;
                inset: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                border: none !important;
              }

              .print-modal {
                background: white !important;
                color: black !important;
                page-break-inside: avoid;
                width: 100%;
              }

              .print-modal * {
                page-break-inside: avoid;
                orphans: 2;
                widows: 2;
              }

              .print-button {
                display: none !important;
              }

              button {
                display: none !important;
              }

              .space-y-4 {
                --tw-space-y-reverse: 0;
                margin-top: calc(1rem * calc(1 - var(--tw-space-y-reverse)));
                margin-bottom: calc(1rem * var(--tw-space-y-reverse));
              }

              .print-modal .space-y-3 > * + * {
                margin-top: 0.25rem;
              }

              .print-modal .space-y-2 > * + * {
                margin-top: 0.125rem;
              }

              .print-modal > * {
                margin: 0 !important;
              }

              .print-modal h3 {
                margin: 0.25rem 0 !important;
              }

              .print-modal div {
                margin-top: 0 !important;
                margin-bottom: 0 !important;
              }

              .border-t {
                margin-top: 0.25rem !important;
                margin-bottom: 0 !important;
              }
            }
          `}</style>

          <DialogHeader className="print-modal print:mb-2">
            <DialogTitle className="text-2xl font-bold print:text-xl print:mb-0">
              Booking Details
            </DialogTitle>
          </DialogHeader>

          <div className="print-modal space-y-4 p-4 print:space-y-2 print:p-0">
            {/* Row 2: Order # and Booking confirmed at */}
            <div className="grid grid-cols-2 gap-4 text-sm print:gap-2 print:text-xs">
              <div>
                <p className="text-muted-foreground print:text-xs">Order #</p>
                <p className="font-semibold text-base print:text-sm">
                  {order.order_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground print:text-xs">Booking confirmed at</p>
                <p className="font-semibold text-base print:text-sm">
                  {order.created_at
                    ? formatTimestampInTimezone(
                        order.created_at,
                        order.listing_timezone,
                      )
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Horizontal line */}
            <div className="border-t" />

            {/* Cost breakdown section */}
            <div className="space-y-3 print:space-y-1">
              <h3 className="text-lg font-semibold print:text-base print:mb-1">Cost breakdown</h3>

              {/* Daily Total */}
              <div className="space-y-2 print:space-y-0">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily total</span>
                  <span className="text-muted-foreground">
                    {formatPrice(dailyPrice)} × {totalDays}{" "}
                    {totalDays === 1 ? "day" : "days"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium" />
                  <span className="font-semibold">{formatPrice(dailyTotal)}</span>
                </div>
              </div>

              {/* Listing Insurance */}
              <div className="pt-2 pb-2 border-t border-b print:pt-1 print:mt-0">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">
                      Listing insurance
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowListingInsuranceModal(true)}
                      className="p-0 h-4 w-4 text-muted-foreground hover:text-primary transition-colors print:hidden"
                      aria-label="Information about listing insurance"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(listingInsuranceTotal)}
                  </span>
                </div>
              </div>

              {/* Addons section */}
              {parsedAddons.length > 0 && (
                <div className="space-y-3 print:space-y-1">
                  <p className="text-sm font-medium print:mb-1">Addons</p>
                  <div className="space-y-1 ml-2 print:space-y-0 print:ml-0">
                    {parsedAddons.map((addon) => (
                      <div
                        key={addon.name}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {addon.name}
                          {addon.style && ` (${addon.style})`}
                          {addon.consumable &&
                            addon.qty &&
                            addon.qty > 0 &&
                            ` × ${addon.qty}`}
                        </span>
                        <span className="text-muted-foreground">
                          {formatPrice(addon.price * (addon.qty || 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Addon Insurance Row - Only show if non-consumable addons exist */}
                  {nonconsumableAddons.length > 0 && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t print:pt-1 print:mt-0">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">
                          Addon insurance
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddonInsuranceModal(true)}
                          className="p-0 h-4 w-4 text-muted-foreground hover:text-primary transition-colors print:hidden"
                          aria-label="Information about addon insurance"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        {formatPrice(nonConsumableAddonInsurance)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tax */}
              <div className="flex justify-between text-sm pt-2 border-t print:pt-1 print:mt-0">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-muted-foreground">
                  {formatPrice(order.tax_cents || 0)}
                </span>
              </div>

              {/* Booking Total */}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t print:pt-1 print:mt-0 print:text-sm">
                <span>Booking total</span>
                <span>{formatPrice(order.renter_pays || 0)}</span>
              </div>
            </div>
          </div>

          {/* Print-only footer with insurance information */}
          <div className="hidden print:block space-y-3 text-xs mt-6 pt-4 border-t">
            <div className="space-y-2">
              <p className="font-bold">Listing insurance</p>
              <p className="text-muted-foreground">
                When booking a listing, you will be charged {RENTER_FEE}% of the
                listing's daily rate for the first day and {SUBSEQUENT_DAILY_FEE}%
                per subsequent day to insure the listing's item(s) throughout the
                duration of your rental. Extensions of this order will only be
                charged {SUBSEQUENT_DAILY_FEE}% of the daily rate per extended day.
              </p>
            </div>

            {nonconsumableAddons.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold">Addon insurance</p>
                <p className="text-muted-foreground">
                  When renting a non-consumable addon, you will be charged{" "}
                  {RENTER_FEE}% of the addon's cost for the first day and{" "}
                  {SUBSEQUENT_DAILY_FEE}% per subsequent day to insure that addon
                  throughout the duration of your rental. Extensions of this order
                  will only be charged {SUBSEQUENT_DAILY_FEE}% of the addon's cost
                  per addon per extended day.
                </p>
                <p className="text-muted-foreground">
                  Consumable addons cannot be insured and thus are not charged an
                  insurance fee.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons - hidden in print */}
          <div className="flex gap-3 pt-4 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button className="flex-1 print-button" onClick={handlePrint}>
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listing Insurance Info Modal */}
      <ConfirmationModal
        isOpen={showListingInsuranceModal}
        onOpenChange={setShowListingInsuranceModal}
        title="Listing insurance"
        confirmLabel="Got it"
        onConfirm={() => setShowListingInsuranceModal(false)}
      >
        <p className="text-sm text-muted-foreground">
          When booking a listing, you will be charged {RENTER_FEE}% of the
          listing's daily rate for the first day and {SUBSEQUENT_DAILY_FEE}% per
          subsequent day to insure the listing's item(s) throughout the duration
          of your rental. Extensions of this order will only be charged{" "}
          {SUBSEQUENT_DAILY_FEE}% of the daily rate per extended day.
        </p>
      </ConfirmationModal>

      {/* Addon Insurance Info Modal */}
      <ConfirmationModal
        isOpen={showAddonInsuranceModal}
        onOpenChange={setShowAddonInsuranceModal}
        title="Addon insurance"
        confirmLabel="Got it"
        onConfirm={() => setShowAddonInsuranceModal(false)}
      >
        <p className="text-sm text-muted-foreground">
          When renting a non-consumable addon, you will be charged {RENTER_FEE}%
          of the addon's cost for the first day and {SUBSEQUENT_DAILY_FEE}% per
          subsequent day to insure that addon throughout the duration of your
          rental. Extensions of this order will only be charged {SUBSEQUENT_DAILY_FEE}%
          of the addon's cost per addon per extended day.
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Consumable addons cannot be insured and thus are not charged an
          insurance fee.
        </p>
      </ConfirmationModal>
    </>
  );
}
