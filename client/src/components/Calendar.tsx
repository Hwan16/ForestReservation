import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { formatMonth } from "@/lib/utils";
import { DayAvailability } from "../types";
import { Button } from "@/components/ui/button";

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}

const Calendar = ({ onSelectDate, selectedDate }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const { data: availabilities, isLoading } = useQuery<DayAvailability[]>({
    queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`],
  });

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  const dateFormat = "d";
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  const startDay = getDay(monthStart);
  
  const onNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const onPrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const isDateAvailable = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    if (!availabilities) return false;
    
    const availability = availabilities.find(a => a.date === dateStr);
    if (!availability) return false;
    
    return availability.status.morning.available || availability.status.afternoon.available;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-dark">{formatMonth(currentMonth)}</h2>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onPrevMonth}
            className="p-2 rounded hover:bg-gray-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5"
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onNextMonth}
            className="p-2 rounded hover:bg-gray-100"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5"
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Calendar Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {days.map((day, index) => (
          <div 
            key={index} 
            className={`font-medium ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before start of month */}
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day p-1 text-center"></div>
        ))}
        
        {/* Actual days */}
        {daysInMonth.map((day, index) => {
          const available = isDateAvailable(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          
          return (
            <div key={index} className="calendar-day p-1 text-center">
              <button 
                className={`w-full h-full flex flex-col justify-center items-center rounded-lg 
                  ${available ? 'available' : 'unavailable'} 
                  ${isSelected ? 'selected' : ''}`}
                onClick={() => available && onSelectDate(day)}
                disabled={!available}
              >
                <span className="text-sm md:text-base">{format(day, dateFormat)}</span>
                <span 
                  className={`text-xs ${isSelected ? 'text-white' : available ? 'text-green-600' : 'text-gray-400'} hidden md:inline-block`}
                >
                  {available ? '예약가능' : '예약마감'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex justify-center space-x-8">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-primary rounded-full mr-2"></div>
          <span className="text-sm">예약 선택일</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-600 rounded-full mr-2"></div>
          <span className="text-sm">예약 가능</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 rounded-full mr-2"></div>
          <span className="text-sm">예약 마감</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
