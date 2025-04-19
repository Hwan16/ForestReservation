import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/api';

// CalendarDate 인터페이스 정의
interface CalendarDate {
  date: string;
  morningReserved: boolean;
  afternoonReserved: boolean;
}

interface ReservationCalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

interface DateReservationsType {
  [date: string]: {
    morning: boolean;
    afternoon: boolean;
  };
}

const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  selectedDate,
  setSelectedDate,
}) => {
  const [dateReservations, setDateReservations] = useState<DateReservationsType>({});
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  
  useEffect(() => {
    const fetchAvailabilityData = async () => {
      try {
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        
        const response = await apiRequest(`/api/calendar/${year}/${month}`);
        
        if (response) {
          const reservationData: DateReservationsType = {};
          
          response.forEach((dateInfo: CalendarDate) => {
            const dateKey = format(new Date(dateInfo.date), 'yyyy-MM-dd');
            reservationData[dateKey] = {
              morning: dateInfo.morningReserved,
              afternoon: dateInfo.afternoonReserved,
            };
          });
          
          setDateReservations(reservationData);
        }
      } catch (error) {
        console.error('예약 가능 여부를 확인하는 중 오류가 발생했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityData();
  }, []);

  // Function to determine the CSS class for each day cell
  const getDayClass = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const reservationInfo = dateReservations[dateStr];
    
    if (!reservationInfo) return '';
    
    if (reservationInfo.morning && reservationInfo.afternoon) {
      return 'fully-reserved';
    } else if (reservationInfo.morning) {
      return 'morning-reserved';
    } else if (reservationInfo.afternoon) {
      return 'afternoon-reserved';
    }
    
    return '';
  };

  const renderDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const reservationInfo = dateReservations[dateStr];
    
    return (
      <div className="relative w-full h-full py-1.5">
        <time dateTime={dateStr} className="flex justify-center">
          {day.getDate()}
        </time>
        {reservationInfo && (
          <div className="flex justify-center mt-1 space-x-1">
            {reservationInfo.morning && (
              <div className="w-2 h-2 rounded-full bg-green-500" 
                   title="오전반 예약됨"></div>
            )}
            {reservationInfo.afternoon && (
              <div className="w-2 h-2 rounded-full bg-blue-500" 
                   title="오후반 예약됨"></div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border">
      <div className="mb-4 border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">
          예약 캘린더
        </h2>
        <p className="text-sm text-gray-500 mt-1">날짜를 선택하여 예약 현황을 확인하세요</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-72">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <style>{`
            .rdp {
              --rdp-cell-size: 42px;
              --rdp-accent-color: #3b82f6;
              --rdp-background-color: #e6f2ff;
              --rdp-accent-color-dark: #2563eb;
              --rdp-background-color-dark: #e6f2ff;
              margin: 0;
            }
            .rdp-day_selected {
              font-weight: bold;
              border: 2px solid var(--rdp-accent-color);
            }
            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
              background-color: #f1f5f9;
            }
            .rdp-day_today {
              font-weight: bold;
              color: #3b82f6;
              text-decoration: underline;
            }
            .fully-reserved .rdp-day_selected,
            .fully-reserved:not(.rdp-day_selected) {
              background-color: #f1f1f1;
              color: #9ca3af;
            }
            .rdp-day {
              height: 100%;
              border-radius: 0;
            }
            .rdp-cell {
              border: 1px solid #e5e7eb;
              height: 60px;
            }
            .rdp-month {
              width: 100%;
            }
            .rdp-caption {
              margin-bottom: 1rem;
            }
            .rdp-caption_label {
              font-size: 1.25rem;
              font-weight: 600;
              color: #1f2937;
            }
            .rdp-nav {
              padding: 2px;
            }
            .rdp-head_cell {
              font-weight: 600;
              color: #4b5563;
              padding: 0.5rem 0;
              background-color: #f9fafb;
            }
          `}</style>

          <DayPicker
            locale={ko}
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            footer={
              <div className="pt-4 mt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">오전반 예약됨</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">오후반 예약됨</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>오전반: 09:00 - 13:00</p>
                  <p>오후반: 14:00 - 18:00</p>
                </div>
              </div>
            }
            fromMonth={today}
            modifiersClassNames={{
              selected: 'bg-blue-50',
            }}
            components={{
              Day: ({ date }: { date: Date }) => (
                <div
                  className={`${getDayClass(date)}`}
                >
                  {renderDay(date)}
                </div>
              ),
            }}
          />
        </>
      )}
    </div>
  );
};

export default ReservationCalendar; 