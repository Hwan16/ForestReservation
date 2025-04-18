import { useState, useEffect } from "react";
import { format } from "date-fns";
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
  
  // 선택된 날짜를 현지 시간대 기준으로 정확하게 format
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  console.log("TimeSelection - dateStr:", dateStr, "day of week:", selectedDate.getDay(), "raw date:", selectedDate);
  
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
    const morningStatus = availability.status.morning;
    
    // 가능/불가능 상태를 API 응답의 available 속성 그대로 사용
    return {
      ...morningStatus
    };
  };

  const getAfternoonDetails = () => {
    if (isLoading || !availability) return { available: false, capacity: 0, reserved: 0 };
    const afternoonStatus = availability.status.afternoon;
    
    // 가능/불가능 상태를 API 응답의 available 속성 그대로 사용
    return {
      ...afternoonStatus
    };
  };
  
  // API 데이터 디버깅용 콘솔 로그
  useEffect(() => {
    if (availability) {
      console.log(`TimeSelection - Date: ${dateStr}`, availability);
    }
  }, [availability, dateStr]);

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
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">오전</h3>
                {morningDetails.available ? (
                  <span className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded-full font-medium">예약 가능</span>
                ) : (
                  <span className="text-sm bg-gray-100 text-gray-600 py-1 px-2 rounded-full font-medium">예약 마감</span>
                )}
              </div>
              <p className="text-gray-600">09:00 - 13:00</p>
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
                  현재 예약 인원: {morningDetails.reserved}/{morningDetails.capacity}명
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
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">오후</h3>
                {afternoonDetails.available ? (
                  <span className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded-full font-medium">예약 가능</span>
                ) : (
                  <span className="text-sm bg-gray-100 text-gray-600 py-1 px-2 rounded-full font-medium">예약 마감</span>
                )}
              </div>
              <p className="text-gray-600">14:00 - 18:00</p>
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
                  현재 예약 인원: {afternoonDetails.reserved}/{afternoonDetails.capacity}명
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
