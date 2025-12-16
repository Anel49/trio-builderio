import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  formatDateForApi,
  getEarliestExtensionDate,
  calculateExtensionTotal,
  isValidExtensionDateRange,
} from "@/lib/extensions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

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
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  // Parse order dates
  const orderEndDate = new Date(order?.end_date || new Date());
  const minSelectableDate = getEarliestExtensionDate(orderEndDate);
  const minTimeDate = get24HourMinimumDate();

  // The actual minimum selectable is whichever is later
  const effectiveMinDate =
    minSelectableDate > minTimeDate ? minSelectableDate : minTimeDate;

  // Build disabled date ranges
  const disabledRanges = [
    // Disable all dates up to the effective minimum
    { startDate: new Date(0), endDate: new Date(effectiveMinDate.getTime() - 1) },
    // Add conflicting dates
    ...conflictingDates.map((range) => ({
      startDate: range.startDate,
      endDate: range.endDate,
    })),
  ];

  // Calculate totals if dates are selected
  const totalDays =
    dateRange.start && dateRange.end
      ? Math.ceil(
          (dateRange.end.getTime() - dateRange.start.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const totalPrice =
    dateRange.start && dateRange.end && order?.daily_price_cents
      ? calculateExtensionTotal(
          order.daily_price_cents,
          dateRange.start,
          dateRange.end
        )
      : 0;

  const handleSubmit = async () => {
    if (dateRange.start && dateRange.end) {
      await onSubmit(dateRange.start, dateRange.end);
      // Reset on success (modal will close from parent)
      setDateRange({ start: null, end: null });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDateRange({ start: null, end: null });
    }
    onOpenChange(newOpen);
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

          {/* Date picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select extension dates
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              disabledDateRanges={disabledRanges}
              minDate={effectiveMinDate}
              buttonClassName="w-full"
            />
          </div>

          {/* Price preview */}
          {dateRange.start && dateRange.end && (
            <div className="p-3 bg-muted rounded space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily rate:</span>
                <span className="font-medium">
                  ${(order?.daily_price_cents || 0) / 100}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days:</span>
                <span className="font-medium">{totalDays}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span>Total:</span>
                <span>${(totalPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Selected dates summary */}
          {dateRange.start && dateRange.end && (
            <div className="p-3 bg-muted rounded">
              <p className="text-sm text-muted-foreground mb-1">
                Extension period:
              </p>
              <p className="text-sm font-semibold">
                {format(dateRange.start, "MMM dd")} -{" "}
                {format(dateRange.end, "MMM dd, yyyy")}
              </p>
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
            disabled={!dateRange.start || !dateRange.end || isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Requesting..." : "Request Extension"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
