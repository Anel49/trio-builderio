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
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      {isOpen && (
        <Card className="absolute bottom-full left-0 right-0 z-50 mb-2">
          <CardContent className="p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-xs font-medium text-muted-foreground text-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isDisabled = isDateDisabled(date);
                const reservation = getReservationForDate(date);
                const isReserved = reservation !== null;
                const isInRange = isDateInRange(date);
                const isRangeStart = isDateRangeStart(date);
                const isRangeEnd = isDateRangeEnd(date);
                const isToday = date.toDateString() === new Date().toDateString();

                // Check if this date is start/end of a reservation period
                const isReservationStart = reservation && date.toDateString() === reservation.startDate.toDateString();
                const isReservationEnd = reservation && date.toDateString() === reservation.endDate.toDateString();
                const isReservationMiddle = reservation && !isReservationStart && !isReservationEnd;

                return (
                  <div key={index} className="relative group">
                    <button
                      onClick={() => handleDateClick(date)}
                      disabled={isDisabled}
                      title={isReserved ? `Reserved (${reservation?.status})` : ''}
                      className={cn(
                        "w-full h-8 text-sm relative transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring",
                        "disabled:opacity-75 disabled:cursor-not-allowed",
                        !isCurrentMonth && "text-muted-foreground",
                        isToday && "font-bold ring-2 ring-blue-500",
                        // User selection styling
                        isInRange && !isRangeStart && !isRangeEnd && "bg-primary/20",
                        (isRangeStart || isRangeEnd) && "bg-primary text-primary-foreground",
                        // Reservation styling
                        isReserved && reservation?.status === 'confirmed' && "bg-red-500 text-white",
                        isReserved && reservation?.status === 'pending' && "bg-orange-400 text-white",
                        isReserved && reservation?.status === 'completed' && "bg-gray-400 text-white",
                        // Rounded corners for reservation periods
                        isReservationStart && !isReservationEnd && "rounded-l-md",
                        isReservationEnd && !isReservationStart && "rounded-r-md",
                        isReservationStart && isReservationEnd && "rounded-md",
                        isReservationMiddle && "rounded-none",
                        isDisabled && "hover:bg-transparent hover:text-muted-foreground"
                      )}
                    >
                      {date.getDate()}
                    </button>

                    {/* Tooltip for reserved dates */}
                    {isReserved && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Reserved ({reservation?.status})
                        <br />
                        {reservation?.startDate.toLocaleDateString()} - {reservation?.endDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange({ start: null, end: null });
                  setSelectingEnd(false);
                }}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
