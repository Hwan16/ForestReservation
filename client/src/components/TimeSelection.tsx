import { useState, useEffect } from "react";
import { format, getDay, startOfDay, isBefore } from "date-fns";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TimeSlot, DayAvailability } from "../types";
import { useLocation } from "wouter";

interface TimeSelectionProps {
  selectedDate: Date;
  onSelectTime: (time: TimeSlot) => void;
  onBack: () => void;
}

const TimeSelection = ({ selectedDate, onSelectTime, onBack }: TimeSelectionProps) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [_, setLocation] = useLocation();
  
  // 선택된 날짜를 현지 시간대 기준으로 정확하게 format
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const dayOfWeek = selectedDate.getDay();
  
  console.log("TimeSelection - dateStr:", dateStr, "day of week:", dayOfWeek, "raw date:", selectedDate);
  
  // 쿼리 설정에서 날짜 문자열을 키에 포함시키고 staleTime을 0으로 설정하여 항상 새로 가져오게 함
  const { data: availability, isLoading } = useQuery<DayAvailability>({
    queryKey: [`availability`, dateStr],
    queryFn: async () => {
      try {
        console.log(`Fetching availability for date: ${dateStr}`);
        const response = await fetch(`/api/availability/date/${dateStr}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(`Received availability data:`, data);
        return data as DayAvailability;
      } catch (error) {
        console.error(`Failed to fetch availability for ${dateStr}:`, error);
        // 기본 데이터 구조 반환
        return {
          date: dateStr,
          status: {
            morning: { available: dayOfWeek !== 0, capacity: 30, reserved: 0 },
            afternoon: { available: dayOfWeek !== 0, capacity: 30, reserved: 0 }
          }
        } as DayAvailability;
      }
    },
    staleTime: 0, // 항상 새 데이터를 요청하도록 설정
    gcTime: 0, // 캐시 유지 시간 최소화 (cacheTime -> gcTime으로 변경됨)
  });
  
  // 날짜가 변경될 때마다 데이터 자동으로 가져오기
  useEffect(() => {
    console.log(`Date changed to ${dateStr}`);
  }, [dateStr]);

  const handleContinue = () => {
    if (selectedTimeSlot) {
      onSelectTime(selectedTimeSlot);
    }
  };

  const handleSelectTime = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };
  
  // 홈으로 이동하는 함수
  const goToHome = () => {
    // window.location.href를 사용하여 강제로 홈 페이지로 이동
    window.location.href = "/";
  };

  // Format details for UI display
  const getMorningDetails = () => {
    // 일요일(0)인 경우 예약 불가
    if (dayOfWeek === 0) return { available: false, capacity: 0, reserved: 0 };
    
    // 지난 날짜인 경우 예약 불가
    const today = startOfDay(new Date());
    if (isBefore(selectedDate, today)) return { available: false, capacity: 0, reserved: 0 };
    
    // availability 데이터가 없는 경우 (API 응답 없음) 
    // 일요일이 아니면 예약 가능으로 처리
    if (isLoading || !availability) {
      return { 
        available: dayOfWeek !== 0, 
        capacity: 30, 
        reserved: 0
      };
    }
    
    // API 응답을 사용하고 토요일(6)인 경우 항상 available 상태로 확인
    const morningStatus = availability.status.morning;
    
    // 토요일인 경우 수동으로 available 체크
    if (dayOfWeek === 6) {
      console.log("토요일 오전 available 상태 확인:", morningStatus.available);
    }
    
    return {
      ...morningStatus
    };
  };

  const getAfternoonDetails = () => {
    // 일요일(0)인 경우 예약 불가
    if (dayOfWeek === 0) return { available: false, capacity: 0, reserved: 0 };
    
    // 지난 날짜인 경우 예약 불가
    const today = startOfDay(new Date());
    if (isBefore(selectedDate, today)) return { available: false, capacity: 0, reserved: 0 };
    
    // availability 데이터가 없는 경우 (API 응답 없음)
    // 일요일이 아니면 예약 가능으로 처리
    if (isLoading || !availability) {
      return { 
        available: dayOfWeek !== 0, 
        capacity: 30, 
        reserved: 0
      };
    }
    
    // API 응답을 사용하고 토요일(6)인 경우 항상 available 상태로 확인
    const afternoonStatus = availability.status.afternoon;
    
    // 토요일인 경우 수동으로 available 체크
    if (dayOfWeek === 6) {
      console.log("토요일 오후 available 상태 확인:", afternoonStatus.available);
    }
    
    return {
      ...afternoonStatus
    };
  };
  
  // API 데이터 디버깅용 콘솔 로그
  useEffect(() => {
    console.log(`TimeSelection - Selected date: ${dateStr}, dayOfWeek: ${dayOfWeek}`);
    if (availability) {
      console.log(`TimeSelection - Availability data:`, availability);
    } else {
      console.log(`TimeSelection - No availability data, using default values`);
    }
  }, [availability, dateStr, dayOfWeek]);

  const morningDetails = getMorningDetails();
  const afternoonDetails = getAfternoonDetails();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center mb-6">
        <div 
          onClick={goToHome}
          className="text-xl font-bold text-green-700 hover:text-green-600 transition-colors flex items-center cursor-pointer"
        >
          <span className="flex items-center">
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
              className="mr-2 text-green-700"
            >
              <path d="M12 2L4.5 10l.5.5L12 18l7.5-7.5.5-.5z" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
            아름유아 숲 체험원
          </span>
        </div>
      </div>
      
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
                <h3 className="font-medium text-lg">오전반</h3>
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
                  현재 예약 인원: {morningDetails.reserved}명
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
                <h3 className="font-medium text-lg">오후반</h3>
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
                  현재 예약 인원: {afternoonDetails.reserved}명
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
