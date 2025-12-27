import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";

interface Order {
  id: string;
  order_number?: string;
  host_name?: string | null;
  renter_name?: string | null;
  [key: string]: any;
}

interface OpenClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  claimType: string;
  onClaimTypeChange: (type: string) => void;
  incidentDate: string;
  onIncidentDateChange: (date: string) => void;
  claimDetails: string;
  onClaimDetailsChange: (details: string) => void;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

const claimTypeOptions = [
  { label: "Damage", value: "damage" },
  { label: "Late Return", value: "late return" },
  { label: "Missing", value: "missing" },
  { label: "Theft", value: "theft" },
  { label: "Other", value: "other" },
];

export function OpenClaimModal({
  open,
  onOpenChange,
  order,
  claimType,
  onClaimTypeChange,
  incidentDate,
  onIncidentDateChange,
  claimDetails,
  onClaimDetailsChange,
  isSubmitting = false,
  onSubmit,
}: OpenClaimModalProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!incidentDate) return undefined;
    const [year, month, day] = incidentDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [incidentDate]);

  const isFormValid =
    claimType.trim() !== "" &&
    incidentDate.trim() !== "" &&
    claimDetails.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-visible">
        <DialogHeader>
          <DialogTitle>
            {order ? `Open Claim for ${order.order_number}` : "Open Claim"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-visible">
          {/* Claim Details Header */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Claim Details</h3>

            {/* Order Information */}
            <div className="space-y-2 text-sm">
              {order && (
                <>
                  <p className="text-muted-foreground">
                    Order #{order.order_number}
                  </p>
                  <p className="text-muted-foreground">
                    Host: {order.host_name || "Unknown"}
                  </p>
                  <p className="text-muted-foreground">
                    Renter: {order.renter_name || "Unknown"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Claim Type */}
          <div className="space-y-2">
            <label htmlFor="claim-type" className="text-sm font-medium">
              Claim type
              <span className={cn(
                "ml-1",
                claimType.trim() ? "text-muted-foreground" : "text-red-500"
              )}>
                *
              </span>
            </label>
            <Select value={claimType} onValueChange={onClaimTypeChange}>
              <SelectTrigger id="claim-type">
                <SelectValue placeholder="Select claim type" />
              </SelectTrigger>
              <SelectContent>
                {claimTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Incident Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Incident date
              <span className={cn(
                "ml-1",
                incidentDate.trim() ? "text-muted-foreground" : "text-red-500"
              )}>
                *
              </span>
            </label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <div className="calendar-with-range-styling">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        const localDateString = `${year}-${month}-${day}`;
                        onIncidentDateChange(localDateString);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Claim Details */}
          <div className="space-y-2">
            <label htmlFor="claim-details" className="text-sm font-medium">
              Claim details
              <span className={cn(
                "ml-1",
                claimDetails.trim() ? "text-muted-foreground" : "text-red-500"
              )}>
                *
              </span>
            </label>
            <textarea
              id="claim-details"
              placeholder="Describe what happened..."
              value={claimDetails}
              onChange={(e) => onClaimDetailsChange(e.target.value)}
              className="w-full min-h-28 p-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Submitting..." : "Submit Claim"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
