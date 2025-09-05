import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { ReservationPeriod } from "@/lib/reservations";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);
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
    if (value.start && !value.end) return `${formatDate(value.start)} - Select end date`;
    if (value.start && value.end) {
      return `${formatDate(value.start)} - ${formatDate(value.end)}`;
    }
    return "Select dates";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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

    // If selecting end date, disable dates before start date
    if (selectingEnd && value.start && date < value.start) return true;

    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!value.start || !value.end) return false;
    return date >= value.start && date <= value.end;
  };

  const isDateRangeStart = (date: Date) => {
    return value.start && date.toDateString() === value.start.toDateString();
  };

  const isDateRangeEnd = (date: Date) => {
    return value.end && date.toDateString() === value.end.toDateString();
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!value.start || selectingEnd) {
      if (!value.start) {
        onChange({ start: date, end: null });
        setSelectingEnd(true);
      } else {
        // Selecting end date
        if (date >= value.start) {
          onChange({ start: value.start, end: date });
          setSelectingEnd(false);
          setIsOpen(false);
        } else {
          // If clicked date is before start, make it the new start
          onChange({ start: date, end: null });
          setSelectingEnd(true);
        }
      }
    } else {
      // Reset selection
      onChange({ start: date, end: null });
      setSelectingEnd(true);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
                const isReserved = isDateReserved(date);
                const isInRange = isDateInRange(date);
                const isRangeStart = isDateRangeStart(date);
                const isRangeEnd = isDateRangeEnd(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    disabled={isDisabled}
                    className={cn(
                      "p-2 text-sm rounded-md relative transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      !isCurrentMonth && "text-muted-foreground",
                      isToday && "font-bold",
                      isInRange && !isRangeStart && !isRangeEnd && "bg-primary/20",
                      (isRangeStart || isRangeEnd) && "bg-primary text-primary-foreground",
                      isReserved && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 line-through",
                      isDisabled && "hover:bg-transparent hover:text-muted-foreground"
                    )}
                  >
                    {date.getDate()}
                    {isReserved && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 dark:bg-red-900 rounded border"></div>
                <span className="text-muted-foreground">Reserved dates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-muted-foreground">Selected range</span>
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
