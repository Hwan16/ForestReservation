import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Reservation, DayAvailability } from '../types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatMonth } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";

// 관리자 대시보드 컴포넌트
const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | null>(null);
  const [availabilityCapacity, setAvailabilityCapacity] = useState(20);
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 사용자 인증 확인
  const { data: user, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ['/api/auth/me'],
    gcTime: 0,
    retry: false,
    onSuccess: (data) => {
      if (!data || !data.isAdmin) {
        toast({
          title: '인증 오류',
          description: '관리자 권한이 필요합니다.',
          variant: 'destructive',
        });
        setLocation('/');
      }
    },
    onError: () => {
      toast({
        title: '인증 오류',
        description: '관리자 로그인이 필요합니다.',
        variant: 'destructive',
      });
      setLocation('/');
    }
  });

  // 모든 예약 가져오기
  const { data: reservations, isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/all'],
    enabled: !!user,
  });

  // 월별 가용성 가져오기
  const { data: availabilities, isLoading: availabilitiesLoading } = useQuery<DayAvailability[]>({
    queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`],
    enabled: !!user,
  });

  // 선택한 날짜의 예약 내역 필터링
  const getReservationsForDate = (date: Date) => {
    if (!reservations) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.date === dateStr);
  };

  // 날짜의 예약 가능 여부 확인
  const getAvailabilityForDate = (date: Date) => {
    if (!availabilities) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.find(a => a.date === dateStr);
  };

  // 예약 삭제 뮤테이션
  const { mutate: deleteReservation, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/reservations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: '삭제 완료',
        description: '예약이 성공적으로 삭제되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/all'] });
      setShowDeleteDialog(false);
      setSelectedReservation(null);
    },
    onError: (error) => {
      toast({
        title: '삭제 오류',
        description: `예약 삭제 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 가용성 업데이트 뮤테이션
  const { mutate: updateAvailability, isPending: isUpdatingAvailability } = useMutation({
    mutationFn: async (data: { date: string; timeSlot: string; capacity: number; available: boolean }) => {
      await apiRequest('PATCH', `/api/availability/update`, data);
    },
    onSuccess: () => {
      toast({
        title: '변경 완료',
        description: '예약 가능 설정이 업데이트되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`] });
      setShowAvailabilityDialog(false);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    },
    onError: (error) => {
      toast({
        title: '업데이트 오류',
        description: `예약 가능 설정 변경 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 로그아웃 뮤테이션
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      toast({
        title: '로그아웃 성공',
        description: '안전하게 로그아웃되었습니다.',
      });
      setLocation('/');
    },
  });

  // 삭제 확인 핸들러
  const confirmDelete = () => {
    if (selectedReservation) {
      deleteReservation(selectedReservation.id);
    }
  };

  // 가용성 설정 확인 핸들러
  const confirmAvailabilityUpdate = () => {
    if (selectedDate && selectedTimeSlot) {
      updateAvailability({
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedTimeSlot,
        capacity: availabilityCapacity,
        available: availabilityEnabled
      });
    }
  };

  // 날짜 선택 핸들러
  const handleDateSelection = (date: Date, timeSlot: 'morning' | 'afternoon') => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    
    // 현재 가용성 설정 가져오기
    const dateAvailability = getAvailabilityForDate(date);
    const slotAvailability = dateAvailability?.status[timeSlot];
    
    if (slotAvailability) {
      setAvailabilityCapacity(slotAvailability.capacity);
      setAvailabilityEnabled(slotAvailability.available);
    } else {
      // 기본값 설정
      setAvailabilityCapacity(20);
      setAvailabilityEnabled(true);
    }
    
    setShowAvailabilityDialog(true);
  };

  // 날짜 별 예약 필터링
  const todayReservations = reservations?.filter(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  ) || [];

  const upcomingReservations = reservations?.filter(
    (r) => new Date(r.date) > new Date()
  ) || [];

  const pastReservations = reservations?.filter(
    (r) => new Date(r.date) < new Date() && new Date(r.date).toDateString() !== new Date().toDateString()
  ) || [];

  // 시간대 텍스트 반환
  const getTimeSlotText = (timeSlot: string) => {
    return timeSlot === 'morning' ? '오전 (09:00 - 13:00)' : '오후 (14:00 - 18:00)';
  };

  // 달력 관련 변수
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;
  const dateFormat = "d";
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const startDay = getDay(monthStart);

  // 달 변경 핸들러
  const onNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const onPrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (authError) {
    return null; // onError 콜백을 통해 리디렉션
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">아름유아 숲 체험원 - 관리자</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation('/')}>
              메인으로
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">오늘 예약</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{todayReservations.length}건</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">이번 주 예약</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {upcomingReservations.filter(r => {
                  const date = new Date(r.date);
                  const today = new Date();
                  const endOfWeek = new Date(today);
                  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
                  return date <= endOfWeek;
                }).length}건
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">전체 예약</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reservations?.length || 0}건</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">캘린더 뷰</TabsTrigger>
            <TabsTrigger value="list">리스트 뷰</TabsTrigger>
          </TabsList>
          
          {/* 캘린더 뷰 */}
          <TabsContent value="calendar">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onPrevMonth}
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
              
              {/* 요일 */}
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
              
              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {/* 이전 월 빈 셀 */}
                {Array.from({ length: startDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-32 p-1"></div>
                ))}
                
                {/* 실제 날짜 */}
                {daysInMonth.map((day, index) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSunday = getDay(day) === 0;
                  const dayReservations = getReservationsForDate(day);
                  const availability = getAvailabilityForDate(day);
                  
                  return (
                    <div 
                      key={index} 
                      className={`h-32 p-1 border rounded ${isSunday ? 'bg-red-50' : 'bg-white'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-semibold ${isSunday ? 'text-red-500' : ''}`}>
                          {format(day, dateFormat)}
                        </span>
                        <span className="text-xs">
                          {dayReservations.length > 0 && `${dayReservations.length}건`}
                        </span>
                      </div>
                      
                      {/* 오전/오후 가용성 및 예약 */}
                      {!isSunday && (
                        <div className="mt-1">
                          <div 
                            className={`text-xs p-1 mb-1 rounded cursor-pointer ${
                              availability?.status.morning.available 
                                ? 'bg-green-50 hover:bg-green-100' 
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => handleDateSelection(day, 'morning')}
                          >
                            <div className="flex justify-between">
                              <span>오전</span>
                              <span>
                                {availability ? `${availability.status.morning.reserved}/${availability.status.morning.capacity}` : '0/0'}
                              </span>
                            </div>
                          </div>
                          
                          <div 
                            className={`text-xs p-1 rounded cursor-pointer ${
                              availability?.status.afternoon.available 
                                ? 'bg-green-50 hover:bg-green-100' 
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => handleDateSelection(day, 'afternoon')}
                          >
                            <div className="flex justify-between">
                              <span>오후</span>
                              <span>
                                {availability ? `${availability.status.afternoon.reserved}/${availability.status.afternoon.capacity}` : '0/0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 예약 목록 (최대 2개) */}
                      {dayReservations.slice(0, 2).map((res) => (
                        <div 
                          key={res.id} 
                          className="text-xs truncate mt-1 bg-blue-50 p-1 rounded"
                          title={`${res.name} (${res.participants}명)`}
                        >
                          {res.name} ({res.participants}명)
                        </div>
                      ))}
                      {dayReservations.length > 2 && (
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          외 {dayReservations.length - 2}건
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                * 날짜를 클릭하여 예약 가능 여부와 인원을 설정할 수 있습니다.
              </div>
            </div>
          </TabsContent>
          
          {/* 리스트 뷰 */}
          <TabsContent value="list">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">예약 관리</h2>
              
              <Tabs defaultValue="today">
                <TabsList className="mb-4">
                  <TabsTrigger value="today">오늘</TabsTrigger>
                  <TabsTrigger value="upcoming">예정된 예약</TabsTrigger>
                  <TabsTrigger value="past">지난 예약</TabsTrigger>
                  <TabsTrigger value="all">전체 예약</TabsTrigger>
                </TabsList>
                
                <TabsContent value="today">
                  <ReservationTable 
                    reservations={todayReservations} 
                    isLoading={reservationsLoading} 
                    onDeleteClick={(reservation) => {
                      setSelectedReservation(reservation);
                      setShowDeleteDialog(true);
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="upcoming">
                  <ReservationTable 
                    reservations={upcomingReservations} 
                    isLoading={reservationsLoading}
                    onDeleteClick={(reservation) => {
                      setSelectedReservation(reservation);
                      setShowDeleteDialog(true);
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="past">
                  <ReservationTable 
                    reservations={pastReservations} 
                    isLoading={reservationsLoading}
                    onDeleteClick={(reservation) => {
                      setSelectedReservation(reservation);
                      setShowDeleteDialog(true);
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="all">
                  <ReservationTable 
                    reservations={reservations || []} 
                    isLoading={reservationsLoading}
                    onDeleteClick={(reservation) => {
                      setSelectedReservation(reservation);
                      setShowDeleteDialog(true);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 예약 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="py-4">
              <p><strong>예약번호:</strong> {selectedReservation.id}</p>
              <p><strong>이름:</strong> {selectedReservation.name}</p>
              <p><strong>날짜:</strong> {formatDate(new Date(selectedReservation.date))}</p>
              <p><strong>시간:</strong> {getTimeSlotText(selectedReservation.timeSlot)}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 가용성 설정 다이얼로그 */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 가능 설정</DialogTitle>
            <DialogDescription>
              {selectedDate && `${formatDate(selectedDate)} ${selectedTimeSlot === 'morning' ? '오전' : '오후'} 시간대의 예약 가능 설정을 변경합니다.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="availability-toggle">예약 가능 여부</Label>
              <Switch 
                id="availability-toggle" 
                checked={availabilityEnabled}
                onCheckedChange={setAvailabilityEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity-input">최대 예약 인원</Label>
              <Input 
                id="capacity-input"
                type="number"
                min="1"
                max="100"
                value={availabilityCapacity}
                onChange={(e) => setAvailabilityCapacity(parseInt(e.target.value) || 1)}
                disabled={!availabilityEnabled}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
              취소
            </Button>
            <Button onClick={confirmAvailabilityUpdate} disabled={isUpdatingAvailability}>
              {isUpdatingAvailability ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 예약 테이블 컴포넌트
interface ReservationTableProps {
  reservations: Reservation[];
  isLoading: boolean;
  onDeleteClick: (reservation: Reservation) => void;
}

const ReservationTable = ({ reservations, isLoading, onDeleteClick }: ReservationTableProps) => {
  // 날짜별로 정렬 (최신순)
  const sortedReservations = [...reservations].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (isLoading) {
    return <p>로딩 중...</p>;
  }

  if (sortedReservations.length === 0) {
    return <p className="py-4 text-center text-gray-500">예약 내역이 없습니다.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>예약번호</TableHead>
          <TableHead>날짜</TableHead>
          <TableHead>시간</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>인원</TableHead>
          <TableHead>예약일</TableHead>
          <TableHead>관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedReservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell className="font-medium">{reservation.id}</TableCell>
            <TableCell>{formatDate(new Date(reservation.date))}</TableCell>
            <TableCell>
              {reservation.timeSlot === 'morning' ? '오전' : '오후'}
            </TableCell>
            <TableCell>{reservation.name}</TableCell>
            <TableCell>{reservation.phone}</TableCell>
            <TableCell>{reservation.participants}명</TableCell>
            <TableCell>{new Date(reservation.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDeleteClick(reservation)}
              >
                삭제
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AdminDashboard;
