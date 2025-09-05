import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { ReservationPeriod } from "@/lib/reservations";
import { format } from "date-fns";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  reservations?: ReservationPeriod[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  reservations = [],
  minDate = new Date(),
  maxDate,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateRange = () => {
    if (!value.start && !value.end) return "Select dates";
    if (value.start && !value.end) return `${format(value.start, "MMM dd")} - Select end date`;
    if (value.start && value.end) {
      return `${format(value.start, "MMM dd")} - ${format(value.end, "MMM dd")}`;
    }
    return "Select dates";
  };

  const getReservationForDate = (date: Date): ReservationPeriod | null => {
    return reservations.find(
      (reservation) =>
        date >= reservation.startDate && date <= reservation.endDate
    ) || null;
  };

  const isDateReserved = (date: Date) => {
    return getReservationForDate(date) !== null;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (isDateReserved(date)) return true;

    return false;
  };

  const handleDateSelect = (range: any) => {
    if (range?.from) {
      onChange({
        start: range.from,
        end: range.to || null,
      });

      // Close picker when both dates are selected
      if (range.to) {
        setIsOpen(false);
      }
    }
  };

  const modifiers = {
    reserved_confirmed: (date: Date) => {
      const reservation = getReservationForDate(date);
      return reservation?.status === 'confirmed';
    },
    reserved_pending: (date: Date) => {
      const reservation = getReservationForDate(date);
      return reservation?.status === 'pending';
    },
    reserved_completed: (date: Date) => {
      const reservation = getReservationForDate(date);
      return reservation?.status === 'completed';
    },
  };

  const modifiersStyles = {
    reserved_confirmed: {
      backgroundColor: 'rgb(239 68 68)', // red-500
      color: 'white',
    },
    reserved_pending: {
      backgroundColor: 'rgb(251 146 60)', // orange-400
      color: 'white',
    },
    reserved_completed: {
      backgroundColor: 'rgb(156 163 175)', // gray-400
      color: 'white',
    },
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <style>{`
        .calendar-with-reservation-styling .rdp-day_range_middle {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        .calendar-with-reservation-styling .rdp-day_range_start,
        .calendar-with-reservation-styling .rdp-day_range_end {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
      `}</style>

      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      {isOpen && (
        <Card className="absolute bottom-full left-0 right-0 z-50 mb-2">
          <CardContent className="p-4">
            <div className="calendar-with-reservation-styling">
              <Calendar
                mode="range"
                selected={{
                  from: value.start || undefined,
                  to: value.end || undefined,
                }}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                initialFocus
                numberOfMonths={1}
              />
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t text-xs space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-muted-foreground">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded"></div>
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span className="text-muted-foreground">Your selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span className="text-muted-foreground">Completed</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {value.start && (
              <div className="pt-3 border-t mt-4">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => onChange({ start: null, end: null })}
                  className="w-full"
                >
                  Clear selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
