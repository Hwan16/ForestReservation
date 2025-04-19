import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import AdminReservationView from './AdminReservationView';
import Calendar from './Calendar';
import { CalendarDays, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { logout } from '@/utils/auth';
import { useLocation } from 'wouter';

const AdminPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    toast({
      title: '로그아웃',
      description: '관리자 로그아웃 되었습니다.',
    });
    setLocation('/');
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex justify-between items-center border">
        <div className="flex items-center">
          <CalendarDays className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">
            숲 체험원 예약 관리
            <span className="ml-3 text-sm px-2 py-1 bg-red-600 text-white rounded-md">
              관리자 모드
            </span>
          </h1>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center text-red-600 hover:text-red-800"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1" />
          로그아웃
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 캘린더 섹션 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">예약 캘린더</h2>
          <Calendar onSelectDate={handleDateSelect} selectedDate={selectedDate} isAdminMode={true} />
        </div>
        
        {/* 예약 정보 보기 (선택된 날짜가 있을 때만 표시) */}
        {selectedDate && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                {format(selectedDate, 'yyyy년 MM월 dd일 (E)', { locale: ko })} 예약 현황
              </h2>
            </div>
            <AdminReservationView selectedDate={selectedDate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage; 