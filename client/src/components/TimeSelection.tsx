import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TimeSlot, DayAvailability } from "../types";

interface TimeSelectionProps {
  selectedDate: Date;
  onSelectTime: (time: TimeSlot) => void;
  onBack: () => void;
}

const TimeSelection = ({ selectedDate, onSelectTime, onBack }: TimeSelectionProps) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  const dateStr = selectedDate.toISOString().split('T')[0];
  
  const { data: availability, isLoading } = useQuery<DayAvailability>({
    queryKey: [`/api/availability/date/${dateStr}`],
  });

  const handleContinue = () => {
    if (selectedTimeSlot) {
      onSelectTime(selectedTimeSlot);
    }
  };

  const handleSelectTime = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Format details for UI display
  const getMorningDetails = () => {
    if (isLoading || !availability) return { available: false, capacity: 0, reserved: 0 };
    return availability.status.morning;
  };

  const getAfternoonDetails = () => {
    if (isLoading || !availability) return { available: false, capacity: 0, reserved: 0 };
    return availability.status.afternoon;
  };

  const morningDetails = getMorningDetails();
  const afternoonDetails = getAfternoonDetails();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl font-semibold text-neutral-dark mb-4">시간 선택</h2>
      <p className="mb-4">선택하신 날짜: <span className="font-medium">{formatDate(selectedDate)}</span></p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${morningDetails.available ? 'hover:border-primary' : 'opacity-60 cursor-not-allowed'} ${selectedTimeSlot === 'morning' ? 'border-primary' : 'border-gray-200'}`}
          onClick={() => morningDetails.available && handleSelectTime('morning')}
        >
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full border-2 ${selectedTimeSlot === 'morning' ? 'border-primary' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
              {selectedTimeSlot === 'morning' && (
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">오전</h3>
              <p className="text-gray-600">09:00 - 12:00</p>
              <div className="mt-2 flex items-center">
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
                  className="mr-1 text-gray-600 w-4 h-4"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-sm text-gray-600">
                  예약 가능: {morningDetails.capacity - morningDetails.reserved}/{morningDetails.capacity}명
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${afternoonDetails.available ? 'hover:border-primary' : 'opacity-60 cursor-not-allowed'} ${selectedTimeSlot === 'afternoon' ? 'border-primary' : 'border-gray-200'}`}
          onClick={() => afternoonDetails.available && handleSelectTime('afternoon')}
        >
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full border-2 ${selectedTimeSlot === 'afternoon' ? 'border-primary' : 'border-gray-300'} mr-3 flex items-center justify-center`}>
              {selectedTimeSlot === 'afternoon' && (
                <div className="w-3 h-3 rounded-full bg-primary"></div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">오후</h3>
              <p className="text-gray-600">13:00 - 16:00</p>
              <div className="mt-2 flex items-center">
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
                  className="mr-1 text-gray-600 w-4 h-4"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-sm text-gray-600">
                  예약 가능: {afternoonDetails.capacity - afternoonDetails.reserved}/{afternoonDetails.capacity}명
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-4 py-2 text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors"
        >
          이전으로
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedTimeSlot}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
        >
          정보 입력하기
        </Button>
      </div>
    </div>
  );
};

export default TimeSelection;
