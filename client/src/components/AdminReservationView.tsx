import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reservation } from '../types';
import { Loader2, Edit, Trash2, Info, Lock, Unlock, AlertCircle, Ban } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from '@/hooks/use-toast';
import { AvailabilityStatus } from '../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface AdminReservationViewProps {
  selectedDate: Date;
}

// 서버 응답의 필드명과 클라이언트 타입 간 변환을 위한 인터페이스
interface RawReservation {
  id?: number;
  reservation_id?: string;
  date: string;
  time_slot: string; // 'morning' | 'afternoon'
  name: string;
  inst_name: string;
  phone: string;
  participants: number;
  desired_activity?: string; // 'all' | 'experience'
  parent_participation?: string; // 'yes' | 'no'
  created_at?: string;
}

// 서버 데이터를 클라이언트 타입으로 변환하는 함수
const normalizeReservation = (raw: RawReservation): Reservation => {
  return {
    id: raw.id,
    reservationId: raw.reservation_id,
    date: raw.date,
    timeSlot: raw.time_slot as any,
    name: raw.inst_name,     // 서버의 inst_name -> 클라이언트의 name (어린이집/학교명)
    instName: raw.name,      // 서버의 name -> 클라이언트의 instName (선생님 이름)
    phone: raw.phone,
    participants: raw.participants,
    desiredActivity: raw.desired_activity as any,
    parentParticipation: raw.parent_participation as any,
    timestamp: raw.created_at
  };
};

const AdminReservationView: React.FC<AdminReservationViewProps> = ({ selectedDate }) => {
  // 상태 관리
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus | null>(null);
  const [dialogAction, setDialogAction] = useState<{
    open: boolean;
    timeSlot?: 'morning' | 'afternoon' | 'all' | 'future';
    action: 'open' | 'close';
  }>({ open: false, action: 'close' });
  
  // 업데이트 중인지 추적하기 위한 Ref 추가
  const isUpdatingRef = useRef(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 해당 날짜의 예약 정보 가져오기
  const { data: allReservations, isLoading: isLoadingReservations, refetch: refetchReservations } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/reservations/test');
      if (!response.ok) {
        throw new Error('예약 정보를 가져오는데 실패했습니다.');
      }
      // 서버 데이터 변환 처리
      const rawData = await response.json();
      console.log("서버 원본 데이터:", rawData);
      
      // 데이터가 이미 올바른 형식인지 확인
      if (rawData.length > 0 && 'desired_activity' in rawData[0]) {
        // snake_case에서 camelCase로 변환
        return rawData.map(normalizeReservation);
      }
      return rawData; // 이미 올바른 형식일 경우
    },
    select: (data) => data || [],
  });

  // 현재 선택된 날짜의 예약만 필터링
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // 날짜별 예약 가능 여부 가져오기
  const { data: availability, isLoading: isLoadingAvailability, refetch: refetchAvailability } = useQuery({
    queryKey: ['availability', selectedDateStr],
    queryFn: async () => {
      const response = await fetch(`/api/availability/date/${selectedDateStr}`);
      if (!response.ok) {
        throw new Error('예약 가능 여부 정보를 가져오는데 실패했습니다.');
      }
      return response.json();
    },
    enabled: !!selectedDateStr
  });

  // 가용성 상태 업데이트
  useEffect(() => {
    if (availability) {
      setAvailabilityStatus(availability.status);
    }
  }, [availability]);

  // 가용성 업데이트 뮤테이션
  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ timeSlot, available }: { timeSlot: 'morning' | 'afternoon', available: boolean }) => {
      try {
        // 업데이트 중임을 표시
        isUpdatingRef.current = true;
        
        console.log('업데이트 데이터:', {
          date: selectedDateStr,
          timeSlot,
          capacity: 99999,
          available
        });
        
        // 쿠키가 자동으로 전송되도록 credentials 옵션 설정
        const response = await fetch('/api/availability/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: selectedDateStr,
            timeSlot,
            capacity: 99999, // 큰 숫자로 설정 (실질적으로 무제한)
            available
          }),
          credentials: 'same-origin' // 쿠키를 포함하여 요청
        });

        // 응답 상태 로깅
        console.log('API 응답 상태:', response.status);
        
        // 응답 본문을 텍스트로 먼저 읽기
        const textResponse = await response.text();
        console.log('원본 응답 텍스트:', textResponse);
        
        // 텍스트가 비어있지 않으면 JSON으로 파싱
        let responseData;
        try {
          responseData = textResponse ? JSON.parse(textResponse) : {};
        } catch (e) {
          console.error('JSON 파싱 오류:', e);
          responseData = { message: '서버 응답을 처리할 수 없습니다.' };
        }
        
        // 응답이 성공적이지 않으면 일반 오류로 처리
        if (!response.ok) {
          throw new Error(responseData.message || '예약 가능 여부 업데이트에 실패했습니다.');
        }

        return responseData;
      } catch (error) {
        console.error('업데이트 오류:', error);
        throw error;
      } finally {
        // 업데이트 완료 후 false로 변경
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 500);
      }
    },
    onSuccess: (data) => {
      // 필요한 쿼리만 무효화 (refetch는 제거)
      queryClient.invalidateQueries({ queryKey: ['availability', selectedDateStr] });
      
      toast({
        title: '업데이트 성공',
        description: '예약 가능 여부가 업데이트되었습니다.',
      });
    },
    onError: (error: any) => {
      console.error('뮤테이션 오류:', error);
      
      toast({
        title: '업데이트 실패',
        description: error.message || '예약 가능 여부 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  });

  // 마감/마감 취소 처리 함수
  const handleAvailabilityToggle = (timeSlot: 'morning' | 'afternoon' | 'all' | 'future') => {
    if (timeSlot === 'all') {
      // 전체 마감/마감 취소 처리
      setDialogAction({
        open: true,
        timeSlot: 'all',
        action: availabilityStatus?.morning.available || availabilityStatus?.afternoon.available ? 'close' : 'open'
      });
    } else {
      // 개별 오전/오후 마감 처리
      if (!availabilityStatus) return;
      const isCurrentlyAvailable = availabilityStatus[timeSlot].available;
      
      setDialogAction({
        open: true,
        timeSlot,
        action: isCurrentlyAvailable ? 'close' : 'open'
      });
    }
  };

  // 확인 후 실제 처리 함수
  const confirmAvailabilityAction = () => {
    if (!dialogAction.timeSlot) return;
    
    if (dialogAction.timeSlot === 'all') {
      // 전체 마감/마감 취소 - 두 번째 요청 지연
      const newAvailability = dialogAction.action === 'open';
      updateAvailabilityMutation.mutate({ timeSlot: 'morning', available: newAvailability });
      
      // 두 번째 요청은 약간 지연시켜 서버 부하 방지
      setTimeout(() => {
        updateAvailabilityMutation.mutate({ timeSlot: 'afternoon', available: newAvailability });
      }, 300);
    } else if (dialogAction.timeSlot === 'future') {
      // 다음 날부터 전체 마감 처리
      handleCloseAllFutureDates();
    } else {
      // 개별 마감/마감 취소
      updateAvailabilityMutation.mutate({
        timeSlot: dialogAction.timeSlot,
        available: dialogAction.action === 'open'
      });
    }
    
    // 다이얼로그 닫기
    setDialogAction({ ...dialogAction, open: false });
  };
  
  // 다음 날부터 전체 마감 함수
  const handleCloseAllFutureDates = async () => {
    try {
      // 선택 날짜를 기준으로 다음 날부터 마감
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 3); // 3개월 기간으로 설정
      
      const startDateStr = nextDay.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await fetch('/api/availability/close-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDateStr,
          endDate: endDateStr
        }),
        credentials: 'same-origin'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || '예약 마감 처리에 실패했습니다.');
      }
      
      // 성공 시 알림
      toast({
        title: '전체 마감 처리 성공',
        description: `${responseData.updatedDates?.length || 0}개 날짜의 예약이 마감되었습니다.`,
      });
      
      // 현재 날짜 데이터 새로고침
      refetchAvailability();
      
    } catch (error: any) {
      console.error('전체 마감 처리 오류:', error);
      toast({
        title: '마감 처리 실패',
        description: error.message || '전체 예약 마감 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };
  
  // 확인 다이얼로그 메시지 업데이트
  const getDialogTitle = () => {
    if (!dialogAction.timeSlot) return "";
    
    if (dialogAction.timeSlot === 'all') {
      return dialogAction.action === 'close' 
        ? `${format(selectedDate, 'yyyy-MM-dd')} 전체 예약을 마감하시겠습니까?`
        : `${format(selectedDate, 'yyyy-MM-dd')} 전체 예약을 오픈하시겠습니까?`;
    } else if (dialogAction.timeSlot === 'future') {
      // 다음 날부터 전체 마감 메시지
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return `${format(nextDay, 'yyyy-MM-dd')}부터 3개월간 모든 예약을 마감하시겠습니까?`;
    } else {
      const timeSlotText = dialogAction.timeSlot === 'morning' ? '오전' : '오후';
      return dialogAction.action === 'close'
        ? `${format(selectedDate, 'yyyy-MM-dd')} ${timeSlotText}반 예약을 마감하시겠습니까?`
        : `${format(selectedDate, 'yyyy-MM-dd')} ${timeSlotText}반 예약을 오픈하시겠습니까?`;
    }
  };

  const reservations = allReservations?.filter(res => res.date === selectedDateStr) || [];

  // 주기적으로 데이터 새로고침 (useEffect 수정)
  useEffect(() => {
    // 업데이트 중일 때는 주기적 갱신 방지
    if (isUpdatingRef.current) return;
    
    const intervalId = setInterval(() => {
      refetchReservations();
      refetchAvailability();
    }, 5000); // 5초로 유지
    
    return () => clearInterval(intervalId);
  }, [refetchReservations, refetchAvailability, selectedDateStr]);

  // 오전/오후 예약으로 구분
  const morningReservations = reservations?.filter(res => res.timeSlot === 'morning') || [];
  const afternoonReservations = reservations?.filter(res => res.timeSlot === 'afternoon') || [];

  // 예약 수와 총 인원 계산
  const morningTotalTeams = morningReservations.length;
  const morningTotalParticipants = morningReservations.reduce((sum, res) => sum + res.participants, 0);
  
  const afternoonTotalTeams = afternoonReservations.length;
  const afternoonTotalParticipants = afternoonReservations.reduce((sum, res) => sum + res.participants, 0);

  // 희망 활동 표시 함수
  const getDesiredActivityText = (activity?: string) => {
    if (!activity) return '기본 프로그램';
    if (activity === 'all') return '모두(숲 놀이, 체험 활동)';
    if (activity === 'experience') return '체험 활동만';
    return activity;
  };

  // 학부모 참여 여부 표시 함수
  const getParentParticipationText = (participation?: string) => {
    if (!participation) return '-';
    return participation === 'yes' ? '예' : '아니오 (선생님 및 어린이만 참여)';
  };

  // 예약 정보 테이블 렌더링
  const renderReservationTable = (reservations: Reservation[]) => {
    if (reservations.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          <Info className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          예약 정보가 없습니다.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%]">선생님 이름</TableHead>
            <TableHead className="w-[15%]">어린이집/학교명</TableHead>
            <TableHead className="w-[15%]">연락처</TableHead>
            <TableHead className="w-[10%] text-center">인원수</TableHead>
            <TableHead className="w-[15%]">희망 활동</TableHead>
            <TableHead className="w-[20%]">학부모 참여</TableHead>
            <TableHead className="w-[10%] text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {reservations.map((reservation) => (
            <TableRow key={reservation.id || reservation.reservationId}>
              <TableCell className="font-medium">{reservation.instName}</TableCell>
              <TableCell>{reservation.name}</TableCell>
              <TableCell>{reservation.phone}</TableCell>
              <TableCell className="text-center">{reservation.participants}명</TableCell>
              <TableCell>{getDesiredActivityText(reservation.desiredActivity)}</TableCell>
              <TableCell>{getParentParticipationText(reservation.parentParticipation)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (isLoadingReservations || isLoadingAvailability) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">정보를 불러오는 중...</span>
      </div>
    );
  }

  const isMorningAvailable = availabilityStatus?.morning.available;
  const isAfternoonAvailable = availabilityStatus?.afternoon.available;
  const isAnyAvailable = isMorningAvailable || isAfternoonAvailable;

  return (
    <div className="space-y-6">
      {/* 전체 날짜 마감 관리 버튼 */}
      <Card className="bg-gray-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {format(selectedDate, 'yyyy년 MM월 dd일')} 예약 설정
              </h3>
              <p className="text-gray-600 text-sm">
                이 날짜의 예약 가능 여부를 설정합니다.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="default"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setDialogAction({
                    open: true,
                    timeSlot: 'future',
                    action: 'close'
                  });
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                다음 날부터 전체 마감
              </Button>
              <Button
                variant={isAnyAvailable ? "outline" : "secondary"}
                size="default"
                className={isAnyAvailable ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"}
                onClick={() => handleAvailabilityToggle('all')}
              >
                {isAnyAvailable ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    전체 예약 마감하기
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    전체 예약 오픈하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 오전 예약 */}
      <Card>
        <CardHeader className="bg-amber-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-amber-800">
                오전 예약 현황
                <span className="ml-2 text-sm font-normal text-amber-600">
                  {morningTotalTeams}팀 / {morningTotalParticipants}명
                </span>
              </CardTitle>
              <CardDescription>
              </CardDescription>
            </div>
            <Button 
              variant={isMorningAvailable ? "outline" : "secondary"}
              size="sm"
              className={isMorningAvailable ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"}
              onClick={() => handleAvailabilityToggle('morning')}
            >
              {isMorningAvailable ? (
                <>
                  <Unlock className="h-4 w-4 mr-1" />
                  예약 가능
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  예약 마감
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {renderReservationTable(morningReservations)}
        </CardContent>
      </Card>

      {/* 오후 예약 */}
      <Card>
        <CardHeader className="bg-sky-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-sky-800">
                오후 예약 현황
                <span className="ml-2 text-sm font-normal text-sky-600">
                  {afternoonTotalTeams}팀 / {afternoonTotalParticipants}명
                </span>
              </CardTitle>
              <CardDescription>
              </CardDescription>
            </div>
            <Button 
              variant={isAfternoonAvailable ? "outline" : "secondary"}
              size="sm"
              className={isAfternoonAvailable ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"}
              onClick={() => handleAvailabilityToggle('afternoon')}
            >
              {isAfternoonAvailable ? (
                <>
                  <Unlock className="h-4 w-4 mr-1" />
                  예약 가능
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  예약 마감
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {renderReservationTable(afternoonReservations)}
        </CardContent>
      </Card>

      {/* 하루 전체 요약 */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">전체 예약 현황</h3>
              <p className="text-gray-600 text-sm">
                {format(selectedDate, 'yyyy년 MM월 dd일')} 기준
              </p>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">총 예약</p>
                <p className="text-xl font-bold text-primary">
                  {morningTotalTeams + afternoonTotalTeams}팀
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">총 인원</p>
                <p className="text-xl font-bold text-primary">
                  {morningTotalParticipants + afternoonTotalParticipants}명
                </p>
              </div>
            </div>
      </div>
        </CardContent>
      </Card>

      {/* 확인 다이얼로그 */}
      <AlertDialog open={dialogAction.open} onOpenChange={(open) => setDialogAction({ ...dialogAction, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction.action === 'close' ? (
                <span className="flex items-center text-red-600">
                  <Ban className="h-5 w-5 mr-2" />
                  예약 마감 확인
                </span>
              ) : (
                <span className="flex items-center text-green-600">
                  <Unlock className="h-5 w-5 mr-2" />
                  예약 오픈 확인
                </span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getDialogTitle()}
              <br />
              {dialogAction.action === 'close' && (
                <p className="mt-2 text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  마감 처리 후에는 해당 시간대에 신규 예약이 불가능합니다.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAvailabilityAction}
              className={dialogAction.action === 'close' ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}
            >
              {dialogAction.action === 'close' ? '마감하기' : '오픈하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReservationView; 