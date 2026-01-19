
import React, { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange?: (startDate: Date, endDate: Date) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ 
  startDate: propsStartDate, 
  endDate: propsEndDate,
  onDateChange 
}) => {
  const [startDate, setStartDate] = useState<Date>(propsStartDate || subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(propsEndDate || new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'start' | 'end'>('start');
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(new Date(2025, 4, 1)); // May 2025
  
  const { toast } = useToast();
  
  const formattedDateRange = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  
  // Sync with parent props
  useEffect(() => {
    if (propsStartDate) setStartDate(propsStartDate);
    if (propsEndDate) setEndDate(propsEndDate);
  }, [propsStartDate, propsEndDate]);
  
  useEffect(() => {
    // Set next month based on current month
    const nextMonthDate = new Date(currentMonth);
    nextMonthDate.setMonth(currentMonth.getMonth() + 1);
    setNextMonth(nextMonthDate);
  }, [currentMonth]);
  
  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    
    if (currentView === 'start') {
      setStartDate(date);
      setCurrentView('end');
    } else {
      if (date < startDate) {
        toast({
          title: "Invalid date range",
          description: "End date cannot be before start date.",
          variant: "destructive",
        });
        return;
      }
      setEndDate(date);
      setIsCalendarOpen(false);
      setShowCalendarView(false);
      // Call parent callback
      if (onDateChange) {
        onDateChange(startDate, date);
      }
    }
  };
  
  const applyPredefinedRange = (days?: number, period?: string) => {
    let newStart = new Date();
    let newEnd = new Date();
    
    if (days) {
      // Handle day-based ranges
      newStart = subDays(newEnd, days);
    } else if (period) {
      // Handle period-based ranges
      switch (period) {
        case 'currentMonth':
          newStart = startOfMonth(newEnd);
          break;
        case 'lastMonth':
          newEnd = endOfMonth(new Date(newEnd.getFullYear(), newEnd.getMonth() - 1, 1));
          newStart = startOfMonth(newEnd);
          break;
        case 'q1':
          newStart = new Date(newEnd.getFullYear(), 0, 1); // Jan 1
          newEnd = new Date(newEnd.getFullYear(), 2, 31); // Mar 31
          break;
        case 'q2':
          newStart = new Date(newEnd.getFullYear(), 3, 1); // Apr 1
          newEnd = new Date(newEnd.getFullYear(), 5, 30); // Jun 30
          break;
        case 'q3':
          newStart = new Date(newEnd.getFullYear(), 6, 1); // Jul 1
          newEnd = new Date(newEnd.getFullYear(), 8, 30); // Sep 30
          break;
        case 'q4':
          newStart = new Date(newEnd.getFullYear(), 9, 1); // Oct 1
          newEnd = new Date(newEnd.getFullYear(), 11, 31); // Dec 31
          break;
        case 'currentYear':
          newStart = startOfYear(newEnd);
          break;
        case 'lastYear':
          newEnd = endOfYear(new Date(newEnd.getFullYear() - 1, 0, 1));
          newStart = startOfYear(newEnd);
          break;
      }
    }
    
    setStartDate(newStart);
    setEndDate(newEnd);
    setIsCalendarOpen(false);
    setShowCalendarView(false);
    // Call parent callback
    if (onDateChange) {
      onDateChange(newStart, newEnd);
    }
  };
  
  const previousMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(prev);
  };
  
  const nextMonthHandler = () => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(next);
  };

  const predefinedRanges = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 14 Days', days: 14 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Current Month', period: 'currentMonth' },
    { label: 'Last Month', period: 'lastMonth' },
    { label: 'Q1', period: 'q1' },
    { label: 'Q2', period: 'q2' },
    { label: 'Q3', period: 'q3' },
    { label: 'Q4', period: 'q4' },
    { label: 'Current Year', period: 'currentYear' },
    { label: 'Last Year', period: 'lastYear' },
  ];

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 h-9 border-gray-300"
          onClick={() => {
            setIsCalendarOpen(true);
            setCurrentView('start');
          }}
        >
          <CalendarIcon size={16} />
          <span className="text-sm">{formattedDateRange}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Card className="p-3">
          <div className="grid grid-cols-4 gap-1 mb-2">
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(7)}
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(14)}
            >
              Last 14 Days
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(30)}
            >
              Last 30 Days
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(90)}
            >
              Last 90 Days
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'currentMonth')}
            >
              Current Month
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'lastMonth')}
            >
              Last Month
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-1 mb-3">
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'q1')}
            >
              Q1
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'q2')}
            >
              Q2
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'q3')}
            >
              Q3
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'q4')}
            >
              Q4
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-xs h-7"
              onClick={() => applyPredefinedRange(undefined, 'currentYear')}
            >
              Current Year
            </Button>
          </div>
          
          {showCalendarView ? (
            <div className="flex gap-4 border rounded-lg">
              {/* First month */}
              <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-sm font-medium">
                    {format(currentMonth, 'MMM yyyy')}
                  </div>
                  <button onClick={nextMonthHandler} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
                  <div>Su</div>
                  <div>Mo</div>
                  <div>Tu</div>
                  <div>We</div>
                  <div>Th</div>
                  <div>Fr</div>
                  <div>Sa</div>
                </div>
                {/* Calendar days would go here */}
              </div>
              
              {/* Second month */}
              <div className="p-2 border-l">
                <div className="flex justify-between items-center mb-2">
                  <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-sm font-medium">
                    {format(nextMonth, 'MMM yyyy')}
                  </div>
                  <button onClick={nextMonthHandler} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-center mb-1">
                  <div>Su</div>
                  <div>Mo</div>
                  <div>Tu</div>
                  <div>We</div>
                  <div>Th</div>
                  <div>Fr</div>
                  <div>Sa</div>
                </div>
                {/* Calendar days would go here */}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={currentView === 'start' ? startDate : endDate}
                onSelect={handleSelectDate}
                initialFocus
                className={cn("p-3 pointer-events-auto border rounded-md")}
              />
              <div className="flex justify-between">
                <div>
                  {currentView === 'start' ? 'Select start date' : 'Select end date'}
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (currentView === 'end') {
                      setCurrentView('start');
                    } else {
                      setIsCalendarOpen(false);
                    }
                  }}
                >
                  {currentView === 'end' ? 'Back' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
