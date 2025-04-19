import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { formatMonth } from "@/lib/utils";
import { DayAvailability, Reservation } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  isAdminMode?: boolean;
  reservations?: Reservation[];
}

const Calendar = ({ onSelectDate, selectedDate, isAdminMode = false, reservations = [] }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // 관리자 모드 상태 로깅
  console.log("Calendar - isAdminMode:", isAdminMode, "rendered at:", new Date().toISOString());
  
  // 받은 예약 데이터 전체 로깅 (디버깅용)
  console.log("Calendar - 전달받은 예약 데이터:", reservations.length, "건");
  if (reservations.length > 0) {
    console.log("Calendar - 예약 첫 번째 항목:", reservations[0]);
    
    // 2025-04-22 날짜에 대한 예약 확인
    const testDateStr = '2025-04-22';
    const testDateReservations = reservations.filter(r => r.date === testDateStr);
    console.log(`Calendar - ${testDateStr} 예약:`, testDateReservations.length, "건");
    testDateReservations.forEach((r, i) => console.log(`  예약 ${i+1}:`, r.timeSlot, r.participants, "명"));
  }
  
  // 관리자 모드일 경우 더 자주 갱신
  const { data: availabilities, isLoading, refetch: refetchAvailabilities } = useQuery<DayAvailability[]>({
    queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`],
    refetchInterval: 3000, // 3초마다 자동 갱신
    refetchOnMount: true, // 컴포넌트가 마운트될 때마다 다시 가져오기
    refetchOnWindowFocus: true, // 창이 포커스를 얻을 때마다 다시 가져오기
  });
  
  // 예약 정보 가져오는 주기를 짧게 설정하여 최신 데이터 유지
  useEffect(() => {
    const intervalId = setInterval(() => {
      // 3초마다 예약 정보 다시 가져오기
      if (isAdminMode) {
        // 콘솔에 현재 예약 정보 로깅
        console.log("Calendar - 예약 데이터 강제 갱신 중...", new Date().toLocaleTimeString());
        refetchAvailabilities();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [isAdminMode, refetchAvailabilities]);

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
    // 일요일(0)만 예약 불가로 설정하고 월요일(1)을 포함한 다른 요일은 예약 가능
    if (getDay(day) === 0) return false;
    
    const dateStr = format(day, 'yyyy-MM-dd');
    console.log("Calendar - checking date:", dateStr, "day:", getDay(day));
    
    if (!availabilities) return false;
    
    // 타입 안전하게 변경
    const availability = Array.isArray(availabilities) 
      ? availabilities.find((a: DayAvailability) => a.date === dateStr) 
      : null;
    
    if (!availability) return false;
    
    // API 응답의 available 속성을 그대로 사용
    const isAvailable = availability.status.morning.available || availability.status.afternoon.available;
    console.log("Calendar - availability for", dateStr, ":", isAvailable);
    return isAvailable;
  };

  const getReservationsForDate = (date: Date, timeSlot?: "morning" | "afternoon") => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let filteredReservations = reservations.filter(r => r.date === dateStr);
    
    if (timeSlot) {
      filteredReservations = filteredReservations.filter(r => r.timeSlot === timeSlot);
    }
    
    // 디버깅을 위한 로그 추가
    if (dateStr === '2025-04-22') {
      console.log(`Calendar - 예약 데이터 for ${dateStr} ${timeSlot || 'all'}:`, 
        filteredReservations.length, 
        '예약, 총 인원:', 
        filteredReservations.reduce((sum, r) => sum + r.participants, 0)
      );
    }
    
    return filteredReservations;
  };
  
  const getReservationStats = (date: Date, timeSlot: "morning" | "afternoon") => {
    const reservationsForSlot = getReservationsForDate(date, timeSlot);
    const totalTeams = reservationsForSlot.length;
    const totalParticipants = reservationsForSlot.reduce((sum, res) => sum + res.participants, 0);
    
    // 상세 로깅 (디버깅용)
    const dateStr = format(date, 'yyyy-MM-dd');
    if (dateStr === '2025-04-22') {
      console.log(`Calendar - ${dateStr} ${timeSlot} 통계:`, totalTeams, '팀 /', totalParticipants, '명');
    }
    
    return {
      teams: totalTeams,
      participants: totalParticipants
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          {isAdminMode ? "예약 현황 관리" : "체험 예약하기"}
        </h2>
        <h3 className="text-gray-500 text-center mb-6">
          {isAdminMode ? "Reservation Management" : "Reservation"}
        </h3>
        
        <div className="flex justify-between items-center w-full">
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
          
          <h2 className="text-xl font-semibold">{formatMonth(currentMonth)}</h2>
          
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
          const isSunday = getDay(day) === 0;
          const dateStr = format(day, 'yyyy-MM-dd');
          const morningStats = getReservationStats(day, "morning");
          const afternoonStats = getReservationStats(day, "afternoon");
          
          return (
            <div key={index} className="calendar-day p-1 text-center">
              <button 
                className={`w-full h-full flex flex-col justify-center items-center rounded-lg p-2
                  ${isSelected ? 'bg-primary text-white' : ''} 
                  ${!isSelected && available && !isAdminMode ? 'bg-green-50 border border-green-200 hover:bg-green-100' : ''} 
                  ${!isSelected && !available && !isSunday && !isAdminMode ? 'bg-gray-50 border border-gray-200 text-gray-400' : ''}
                  ${!isSelected && isAdminMode && !isSunday ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' : ''}
                  ${isSunday ? 'bg-red-50 border border-red-200 text-red-500' : ''}
                  transition-colors`}
                onClick={() => {
                  if (isAdminMode || available) {
                    console.log("Calendar - Selected date:", dateStr, "day:", getDay(day));
                    onSelectDate(day);
                  }
                }}
                disabled={!isAdminMode && (!available || isSunday)}
              >
                <span className={`text-sm md:text-base font-medium ${isSunday ? 'text-red-500' : ''}`}>
                  {format(day, dateFormat)}
                </span>
                
                {isSunday ? (
                  <span className="text-xs text-red-500 mt-1">예약불가</span>
                ) : isAdminMode ? (
                  <div className="flex flex-col text-xs mt-1 text-gray-700">
                    <span className="whitespace-nowrap">오전: {morningStats.teams}팀/{morningStats.participants}명</span>
                    <span className="whitespace-nowrap">오후: {afternoonStats.teams}팀/{afternoonStats.participants}명</span>
                  </div>
                ) : (
                  <span 
                    className={`text-xs mt-1 ${isSelected ? 'text-white' : available ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {available ? '예약가능' : '예약마감'}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* 범례 표시 (관리자 모드와 일반 모드에 따라 다르게 표시) */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {isAdminMode ? (
          <>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded-md mr-2"></div>
              <span className="text-sm">조회/수정 가능</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded-md mr-2"></div>
              <span className="text-sm">예약불가 (일요일)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded-md mr-2"></div>
              <span className="text-sm">예약가능</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded-md mr-2"></div>
              <span className="text-sm">예약마감</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded-md mr-2"></div>
              <span className="text-sm">예약불가</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Calendar;
