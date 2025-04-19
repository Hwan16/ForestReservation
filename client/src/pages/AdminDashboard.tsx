import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Reservation, DayAvailability } from '../types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMonth } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Calendar from '@/components/Calendar';
import ReservationDetailDialog from '@/components/ReservationDetailDialog';
import { isAuthenticated } from '@/utils/auth';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // 날짜별 예약 목록을 위한 상태 변수
  const [selectedDateReservations, setSelectedDateReservations] = useState<Reservation[]>([]);
  const [showDateReservationsDialog, setShowDateReservationsDialog] = useState(false);

  // 쿠키와 로컬 스토리지를 통한 인증 확인
  useEffect(() => {
    const checkAuth = () => {
      const hasAdminAuth = isAuthenticated();
      console.log("AdminDashboard - 인증 상태:", hasAdminAuth);
      
      if (!hasAdminAuth) {
        toast({
          title: '인증 오류',
          description: '관리자 로그인이 필요합니다.',
          variant: 'destructive',
        });
        setLocation('/');
      } else {
        setIsAdmin(true);
        setIsLoading(false);
      }
    };
    
    // 초기 인증 확인
    checkAuth();
    
    // 1초마다 인증 상태 확인
    const intervalId = setInterval(checkAuth, 1000);
    
    return () => clearInterval(intervalId);
  }, [setLocation]);
  
  // 로그아웃 처리 함수
  const handleLogout = () => {
    // auth 유틸리티 함수를 사용하여 쿠키와 로컬 스토리지에서 인증 정보 삭제
    import('@/utils/auth').then(({ logout }) => {
      logout();
      
      toast({
        title: '로그아웃',
        description: '관리자 로그아웃 되었습니다.',
      });
      
      setLocation('/');
    });
  };

  // 모든 예약 가져오기
  const { data: reservations, isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/all'],
    enabled: isAdmin,
    refetchInterval: 3000, // 3초마다 자동 갱신하여 실시간 데이터 반영
    refetchOnWindowFocus: true,
  });

  // 월별 가용성 가져오기
  const { data: availabilities, isLoading: availabilitiesLoading } = useQuery<DayAvailability[]>({
    queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`],
    enabled: isAdmin,
    refetchInterval: 3000, // 3초마다 자동 갱신
    refetchOnWindowFocus: true,
  });

  // 선택한 날짜의 예약 내역 필터링
  const getReservationsForDate = (date: Date, timeSlot?: "morning" | "afternoon") => {
    if (!reservations) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    let filteredReservations = reservations.filter(r => r.date === dateStr);
    
    if (timeSlot) {
      filteredReservations = filteredReservations.filter(r => r.timeSlot === timeSlot);
    }
    
    return filteredReservations;
  };
  
  // 날짜 및 시간대별 예약 통계 (팀 수, 총 인원)
  const getReservationStats = (date: Date, timeSlot: "morning" | "afternoon") => {
    const reservationsForSlot = getReservationsForDate(date, timeSlot);
    const totalTeams = reservationsForSlot.length;
    const totalParticipants = reservationsForSlot.reduce((sum, res) => sum + res.participants, 0);
    
    return {
      teams: totalTeams,
      participants: totalParticipants
    };
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
      // 모든 관련 쿼리를 무효화하여 UI가 최신 데이터로 업데이트되도록 함
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/all'] });
      queryClient.invalidateQueries({ queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`] });
      
      // 화면 닫기
      setShowDeleteDialog(false);
      setSelectedReservation(null);
      
      // 날짜별 예약 목록 창이 열려 있었다면 최신 데이터로 업데이트
      if (showDateReservationsDialog && selectedDate) {
        setTimeout(() => {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          const updatedReservations = queryClient.getQueryData<Reservation[]>(['/api/reservations/all']) || [];
          const dateReservations = updatedReservations.filter(r => r.date === dateStr);
          
          setSelectedDateReservations(dateReservations);
          
          // 해당 날짜에 더이상 예약이 없으면 창을 닫음
          if (dateReservations.length === 0) {
            setShowDateReservationsDialog(false);
            toast({
              title: '알림',
              description: '선택한 날짜에 남은 예약이 없습니다.',
            });
          }
        }, 300);
      }
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
      
      // 모든 관련 쿼리 캐시 갱신
      queryClient.invalidateQueries({ queryKey: [`/api/availability/${format(currentMonth, 'yyyy-MM')}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations/all'] });
      
      // UI 상태 초기화
      setShowAvailabilityDialog(false);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      
      console.log("가용성 설정 업데이트 완료, 캐시 갱신됨");
    },
    onError: (error) => {
      toast({
        title: '업데이트 오류',
        description: `예약 가능 설정 변경 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
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

  // 캘린더 날짜 선택 핸들러
  const handleCalendarDateSelect = (date: Date) => {
    // 서버에서 최신 데이터를 직접 가져와서 UI 업데이트
    const fetchLatestReservations = async () => {
      try {
        const response = await fetch('/api/reservations/all');
        if (!response.ok) {
          throw new Error('예약 데이터를 가져오는데 실패했습니다');
        }
        
        const data = await response.json();
        queryClient.setQueryData(['/api/reservations/all'], data);
        
        const dateStr = format(date, 'yyyy-MM-dd');
        const dateReservations = data.filter((r: Reservation) => r.date === dateStr);
        
        console.log(`날짜 ${dateStr} 선택됨, 예약 ${dateReservations.length}건 찾음`);
        
        setSelectedDate(date);
        setSelectedDateReservations(dateReservations);
        setShowDateReservationsDialog(true);
      } catch (error) {
        console.error('예약 데이터 가져오기 오류:', error);
        toast({
          title: '데이터 오류',
          description: '최신 예약 정보를 가져오는데 실패했습니다.',
          variant: 'destructive'
        });
      }
    };
    
    fetchLatestReservations();
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  // 예약 테이블 컴포넌트
  const ReservationTable = ({ 
    reservations, 
    isLoading, 
    onDeleteClick 
  }: { 
    reservations: Reservation[], 
    isLoading: boolean, 
    onDeleteClick: (reservation: Reservation) => void 
  }) => {
    if (isLoading) {
      return <p>로딩 중...</p>;
    }
    
    if (reservations.length === 0) {
      return <p className="text-center py-4 text-gray-500">예약 내역이 없습니다.</p>;
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">예약번호</th>
              <th className="text-left py-2 px-4">날짜</th>
              <th className="text-left py-2 px-4">시간</th>
              <th className="text-left py-2 px-4">이름</th>
              <th className="text-left py-2 px-4">인원</th>
              <th className="text-left py-2 px-4">연락처</th>
              <th className="text-left py-2 px-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{reservation.id.substring(0, 8)}</td>
                <td className="py-3 px-4">{formatDate(new Date(reservation.date))}</td>
                <td className="py-3 px-4">{reservation.timeSlot === 'morning' ? '오전반' : '오후반'}</td>
                <td className="py-3 px-4">
                  <div>{reservation.name}</div>
                  <div className="text-xs text-gray-500">{reservation.instName}</div>
                </td>
                <td className="py-3 px-4">{reservation.participants}명</td>
                <td className="py-3 px-4">
                  <div>{reservation.phone}</div>
                  {reservation.email && <div className="text-xs text-gray-500">{reservation.email}</div>}
                </td>
                <td className="py-3 px-4">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDeleteClick(reservation)}
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">아름유아 숲 체험원 - 관리자</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation('/')}>
              메인으로
            </Button>
            <Button variant="outline" onClick={handleLogout}>
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
              {/* 관리자용 캘린더 컴포넌트 */}
              <Calendar 
                onSelectDate={handleCalendarDateSelect}
                selectedDate={selectedDate}
                isAdminMode={true}
                reservations={reservations || []}
              />
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
              <p><strong>시간:</strong> {selectedReservation.timeSlot === 'morning' ? '오전반' : '오후반'}</p>
              <p><strong>인원:</strong> {selectedReservation.participants}명</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 가용성 설정 다이얼로그 */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && selectedTimeSlot && (
                <span className="flex items-center">
                  <Badge className="mr-2" variant={selectedTimeSlot === 'morning' ? 'outline' : 'default'}>
                    {selectedTimeSlot === 'morning' ? '오전반' : '오후반'}
                  </Badge>
                  {formatDate(selectedDate)} 예약 설정
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && selectedTimeSlot && (
                <span>
                  <Badge className="mr-1" variant="secondary">
                    {selectedTimeSlot === 'morning' ? '오전 09:00 - 13:00' : '오후 14:00 - 18:00'}
                  </Badge>
                  시간대의 예약 가능 여부와 최대 인원을 설정합니다.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between border p-4 rounded-lg">
              <div>
                <h4 className="font-medium">예약 마감 설정</h4>
                <p className="text-sm text-gray-500">해당 시간대의 예약을 받을지 여부를 설정합니다.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${availabilityEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {availabilityEnabled ? '예약 가능' : '예약 마감'}
                </span>
                <Switch 
                  id="availability-switch" 
                  checked={availabilityEnabled}
                  onCheckedChange={setAvailabilityEnabled}
                />
              </div>
            </div>
            
            <div className="border p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="capacity-input" className="font-medium">최대 인원 설정</Label>
                  <Badge variant="outline">{availabilityCapacity}명</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">해당 시간대에 예약 가능한 최대 인원을 설정합니다.</p>
                <Input 
                  id="capacity-input" 
                  type="number" 
                  value={availabilityCapacity}
                  onChange={(e) => setAvailabilityCapacity(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100000}
                />
                <p className="text-xs text-gray-500 mt-2">* 99999로 설정하면 인원 제한이 사실상 없습니다.</p>
              </div>
            </div>
            
            {selectedTimeSlot && selectedDate && (
              <div className="border p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">현재 예약 현황</h4>
                {(() => {
                  const stats = getReservationStats(selectedDate, selectedTimeSlot);
                  return (
                    <div className="text-sm">
                      <p>예약팀: <span className="font-medium">{stats.teams}팀</span></p>
                      <p>총인원: <span className="font-medium">{stats.participants}명</span></p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)} disabled={isUpdatingAvailability}>
              취소
            </Button>
            <Button 
              variant={availabilityEnabled ? "default" : "destructive"} 
              onClick={confirmAvailabilityUpdate} 
              disabled={isUpdatingAvailability}
            >
              {isUpdatingAvailability ? '저장 중...' : availabilityEnabled ? '예약 가능으로 설정' : '예약 마감으로 설정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 새로운 날짜별 예약 상세 다이얼로그 */}
      <ReservationDetailDialog
        isOpen={showDateReservationsDialog}
        onClose={() => setShowDateReservationsDialog(false)}
        date={selectedDate}
        reservations={selectedDateReservations}
        onManageTimeSlot={handleDateSelection}
        onDeleteReservation={(reservation) => {
          setSelectedReservation(reservation);
          setShowDateReservationsDialog(false);
          setShowDeleteDialog(true);
        }}
      />
    </div>
  );
};

export default AdminDashboard;