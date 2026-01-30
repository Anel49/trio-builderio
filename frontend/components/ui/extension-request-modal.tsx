import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  formatDateForApi,
  getEarliestExtensionDate,
  calculateExtensionTotal,
  isValidExtensionDateRange,
} from "@/lib/extensions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationModal } from "@/components/ui/modal-templates";
import { SUBSEQUENT_DAILY_FEE } from "@/lib/constants";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Info } from "lucide-react";

// Utility to parse dates without timezone conversion
const parseDateString = (dateStr: string): Date => {
  // Handle YYYY-MM-DD format or ISO format
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    // Manually create date to avoid timezone conversion
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

interface ExtensionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  conflictingDates: Array<{ startDate: string; endDate: string }>;
  onSubmit: (startDate: Date, endDate: Date) => Promise<void>;
  isLoading?: boolean;
}

export function ExtensionRequestModal({
  open,
  onOpenChange,
  order,
  conflictingDates,
  onSubmit,
  isLoading = false,
}: ExtensionRequestModalProps) {
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showAddonInsuranceModal, setShowAddonInsuranceModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowEndDatePicker(false);
      }
    };

    if (showEndDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEndDatePicker]);

  // Parse order dates (without timezone conversion)
  const orderEndDate = order?.end_date
    ? parseDateString(order.end_date)
    : new Date();

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log("[ExtensionModal] Modal opened");
      console.log("[ExtensionModal] Full order object:", order);
      if (order?.end_date) {
        console.log(
          "[ExtensionModal] Raw end_date from order:",
          order.end_date,
        );
        console.log("[ExtensionModal] Parsed orderEndDate:", orderEndDate);
        console.log(
          "[ExtensionModal] Formatted display:",
          format(orderEndDate, "MMM dd, yyyy"),
        );
      }
    }
  }, [open, order?.end_date, orderEndDate]);

  const requiredStartDate = getEarliestExtensionDate(orderEndDate);

  // Build disabled date ranges for the end date picker
  const disabledRanges = [
    // Disable all dates before the required start date
    { startDate: new Date(0), endDate: orderEndDate },
    // Add conflicting dates
    ...conflictingDates.map((range) => ({
      startDate: range.startDate,
      endDate: range.endDate,
    })),
  ];

  // Calculate totals if end date is selected
  const totalDays = selectedEndDate
    ? Math.ceil(
        (selectedEndDate.getTime() - requiredStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 0;

  const totalPrice =
    selectedEndDate && order?.daily_price_cents
      ? calculateExtensionTotal(
          order.daily_price_cents,
          requiredStartDate,
          selectedEndDate,
          order?.nonconsumable_addon_total || 0,
        )
      : 0;

  const addonCost =
    selectedEndDate && order?.nonconsumable_addon_total
      ? (order.nonconsumable_addon_total || 0) * totalDays
      : 0;

  // Addon insurance for extensions: 1.5% per day on nonconsumable addon total
  const addonInsurance =
    selectedEndDate && order?.nonconsumable_addon_total
      ? Math.round(
          (order.nonconsumable_addon_total || 0) *
            (SUBSEQUENT_DAILY_FEE / 100) *
            totalDays,
        )
      : 0;

  // Parse addons from the order's addons JSON
  const addonsArray: Array<{
    name: string;
    style: string | null;
    price: number;
    consumable: boolean;
  }> = [];
  if (order?.addons) {
    try {
      console.log("[ExtensionModal] order.addons raw:", order.addons);
      const parsedAddons = JSON.parse(order.addons);
      console.log(
        "[ExtensionModal] parsedAddons after JSON.parse:",
        parsedAddons,
      );
      if (typeof parsedAddons === "object" && parsedAddons !== null) {
        Object.entries(parsedAddons).forEach(
          ([itemName, value]: [string, any]) => {
            console.log(
              `[ExtensionModal] Processing addon: ${itemName}`,
              "value:",
              value,
            );
            if (Array.isArray(value) && value.length >= 3) {
              const [style, price, consumableStr] = value;
              console.log(
                `[ExtensionModal] Parsed ${itemName}: style=${style}, price=${price}, consumableStr=${consumableStr}`,
              );
              addonsArray.push({
                name: itemName,
                style: style === "null" ? null : style,
                price: typeof price === "number" ? price : 0,
                consumable: consumableStr === "true",
              });
            }
          },
        );
      }
    } catch (e) {
      console.error("[ExtensionModal] Failed to parse addons:", e);
    }
  } else {
    console.log("[ExtensionModal] No order.addons found");
  }

  console.log("[ExtensionModal] addonsArray after processing:", addonsArray);

  // Filter to nonconsumable addons only (those charged with insurance fee)
  const nonconsumableAddons = addonsArray.filter((addon) => !addon.consumable);
  console.log(
    "[ExtensionModal] nonconsumableAddons after filter:",
    nonconsumableAddons,
  );

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedEndDate(date);
    setShowEndDatePicker(false);

    // Validate the date
    const validation = isValidExtensionDateRange(
      requiredStartDate,
      date,
      orderEndDate,
      conflictingDates,
    );

    if (!validation.valid) {
      setValidationError(validation.reason || "Invalid date");
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEndDate) return;

    // Validate the date range
    const validation = isValidExtensionDateRange(
      requiredStartDate,
      selectedEndDate,
      orderEndDate,
      conflictingDates,
    );

    if (!validation.valid) {
      setValidationError(validation.reason || "Invalid date range");
      return;
    }

    setValidationError(null);
    await onSubmit(requiredStartDate, selectedEndDate);
    // Reset on success (modal will close from parent)
    setSelectedEndDate(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedEndDate(null);
      setShowEndDatePicker(false);
      setValidationError(null);
    }
    onOpenChange(newOpen);
  };

  const isDateDisabled = (date: Date) => {
    // Disable all dates before required start date
    if (date < requiredStartDate) return true;
    // Disable conflicting dates
    return disabledRanges.some((range) => {
      const rangeStart = new Date(range.startDate);
      const rangeEnd = new Date(range.endDate);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      return date >= rangeStart && date < rangeEnd;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Extension</DialogTitle>
          <DialogDescription>
            Extend your booking for {order?.listing_title || "this listing"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original order end date info */}
          <div className="p-3 bg-muted rounded">
            <p className="text-sm text-muted-foreground mb-1">
              Original booking ends:
            </p>
            <p className="text-sm font-semibold">
              {format(orderEndDate, "MMM dd, yyyy")}
            </p>
          </div>

          {/* Select extension dates */}
          <div ref={containerRef} className="relative">
            <label className="text-sm font-medium mb-3 block">
              Select extension dates
            </label>

            <div className="space-y-2">
              {/* Start Date Button - Disabled */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Start date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="inline-flex p-0 h-4 w-4 rounded-full hover:bg-muted transition-colors cursor-pointer">
                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        className="z-[220] w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                        side="bottom"
                        align="start"
                        sideOffset={8}
                      >
                        <p className="text-sm">
                          Extensions must start the day after a booking's end
                          date.
                        </p>
                        <PopoverPrimitive.Arrow className="fill-popover" />
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  </Popover>
                </div>
                <Button
                  variant="outline"
                  disabled
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(requiredStartDate, "MMM dd, yyyy")}
                </Button>
              </div>

              {/* End Date Button - Interactive */}
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">End date</p>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedEndDate
                    ? format(selectedEndDate, "MMM dd, yyyy")
                    : "Select date"}
                </Button>

                {/* End Date Picker - Shown when button is clicked */}
                {showEndDatePicker && (
                  <Card className="absolute top-full left-0 z-50 mt-2 w-fit">
                    <CardContent className="p-4">
                      <CalendarComponent
                        mode="single"
                        selected={selectedEndDate || undefined}
                        onSelect={handleEndDateSelect}
                        disabled={isDateDisabled}
                        initialFocus
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Validation error message */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-900 dark:text-red-100">
                {validationError}
              </p>
            </div>
          )}

          {/* Price preview */}
          {selectedEndDate && (
            <div className="p-3 bg-muted rounded space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily rate:</span>
                <span className="font-medium">
                  $
                  {((order?.daily_price_cents || 0) / 100).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days:</span>
                <span className="font-medium">{totalDays}</span>
              </div>
              {/* Display nonconsumable add-ons with their prices */}
              {nonconsumableAddons.length > 0 && selectedEndDate && (
                <>
                  {console.log(
                    "[ExtensionModal] Rendering nonconsumable addons section with",
                    nonconsumableAddons.length,
                    "addons",
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Non-consumable addons:
                    </span>
                  </div>
                  <div className="space-y-1 ml-2">
                    {nonconsumableAddons.map((addon) => (
                      <div
                        key={addon.name}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {addon.name}
                          {addon.style && ` - ${addon.style}`}
                        </span>
                        <span className="text-muted-foreground">
                          $
                          {(addon.price / 100).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          × {totalDays} day{totalDays !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Addon Insurance Row */}
                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Addon insurance
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddonInsuranceModal(true)}
                        className="p-0 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Information about addon insurance"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-semibold">
                      $
                      {(addonInsurance / 100).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span>Booking subtotal:</span>
                <span>
                  $
                  {((totalPrice + addonInsurance) / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedEndDate || isLoading || !!validationError}
            aria-busy={isLoading}
          >
            {isLoading ? "Requesting..." : "Request Extension"}
          </Button>
        </div>
      </DialogContent>

      <ConfirmationModal
        isOpen={showAddonInsuranceModal}
        onOpenChange={setShowAddonInsuranceModal}
        title="Addon insurance"
        confirmLabel="Got it"
        onConfirm={() => setShowAddonInsuranceModal(false)}
      >
        <p className="text-sm text-muted-foreground">
          When extending a rental with non-consumable addons, you will be
          charged {SUBSEQUENT_DAILY_FEE}% of the addon's cost for each extended
          day to insure that addon throughout the duration of your extension.
        </p>
      </ConfirmationModal>
    </Dialog>
  );
}
