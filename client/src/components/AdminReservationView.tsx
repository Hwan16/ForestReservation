import React, { useEffect, useState, useRef } from 'react';
import { format, addDays, isEqual } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reservation } from '../types';
import { Loader2, Edit, Trash2, Info, Lock, Unlock, AlertCircle, Ban, Save, X } from 'lucide-react';
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
import { Input } from './ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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
    timeSlot?: 'morning' | 'afternoon' | 'all';
    action: 'open' | 'close';
  }>({ open: false, action: 'close' });
  
  // 업데이트 중인지 추적하기 위한 Ref 추가
  const isUpdatingRef = useRef(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 수정 중인 예약 정보 상태 관리
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Reservation>>({});

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
    refetchInterval: 1000, // 1초마다 자동 갱신
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    staleTime: 0, // 항상 최신 데이터 조회
  });

  // 현재 선택된 날짜의 예약만 필터링
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const yearMonth = format(selectedDate, 'yyyy-MM');
  
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
    enabled: !!selectedDateStr,
    refetchInterval: 1000, // 1초마다 자동 갱신
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    staleTime: 0 // 항상 최신 데이터 조회
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

  // 예약 정보 수정 뮤테이션
  const updateReservationMutation = useMutation({
    mutationFn: async (updatedReservation: Partial<Reservation>) => {
      // API 호출 디버깅 로그
      console.log("[디버깅] API 호출 시작, URL:", `/api/reservations/${updatedReservation.reservationId || updatedReservation.id}`);
      console.log("[디버깅] 전송 데이터:", JSON.stringify(updatedReservation, null, 2));
      
      // 실제 API 호출
      const response = await fetch(`/api/reservations/${updatedReservation.reservationId || updatedReservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedReservation),
        credentials: 'same-origin'
      });
      
      // 응답 본문 텍스트로 먼저 읽기
      const textResponse = await response.text();
      console.log("[디버깅] API 응답 상태:", response.status, response.statusText);
      console.log("[디버깅] API 응답 텍스트:", textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : ''));
      
      // 응답이 성공적이지 않으면 오류 메시지 생성
      if (!response.ok) {
        // HTML 응답인지 확인 (<!DOCTYPE 또는 <html로 시작하는지)
        if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
          console.error('서버에서 HTML 응답을 반환했습니다:', textResponse.substring(0, 150) + '...');
          throw new Error('서버 오류: API 엔드포인트가 HTML을 반환했습니다. 서버 로그를 확인하세요.');
        }
        
        // JSON 응답이면 파싱 시도
        try {
          const errorData = JSON.parse(textResponse);
          throw new Error(errorData.message || '예약 정보 업데이트에 실패했습니다.');
        } catch (e) {
          // JSON 파싱 실패 시 기본 오류 메시지 표시
          throw new Error('서버 응답을 처리할 수 없습니다: ' + textResponse.substring(0, 50));
        }
      }
      
      // 성공 응답인 경우 JSON 파싱 시도
      try {
        return JSON.parse(textResponse);
      } catch (e) {
        console.error('성공 응답 파싱 오류:', e);
        console.log('응답 텍스트:', textResponse.substring(0, 150) + '...');
        // 성공했지만 JSON이 아닌 경우 기본 성공 응답 제공
        return {
          success: true,
          message: '업데이트되었습니다'
        };
      }
    },
    onSuccess: (data) => {
      // 수정 완료 후 쿼리 무효화 및 상태 초기화
      console.log("[디버깅] 수정 성공 응답 데이터:", data);
      
      // 명시적으로 쿼리 무효화 및 리패치
      queryClient.invalidateQueries({ queryKey: ['reservations', 'all'] });
      // 갱신된 데이터 즉시 반영을 위해 강제 리패치
      setTimeout(() => {
        refetchReservations();
      }, 500);
      
      toast({
        title: '수정 완료',
        description: '예약 정보가 성공적으로 수정되었습니다.',
      });
      
      // 수정 모드 종료
      setEditingReservation(null);
      setEditFormData({});
    },
    onError: (error: any) => {
      console.error('예약 수정 오류:', error);
      
      toast({
        title: '수정 실패',
        description: error.message || '예약 정보 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  });

  // 마감/마감 취소 처리 함수
  const handleAvailabilityToggle = (timeSlot: 'morning' | 'afternoon' | 'all') => {
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
      
      // timeSlot이 'morning' 또는 'afternoon'인 경우에만 처리
      const currentTimeSlot = timeSlot as 'morning' | 'afternoon';
      const isCurrentlyAvailable = availabilityStatus[currentTimeSlot].available;
      
      setDialogAction({
        open: true,
        timeSlot: currentTimeSlot,
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
  
  // 확인 다이얼로그 메시지 업데이트
  const getDialogTitle = () => {
    if (!dialogAction.timeSlot) return "";
    
    if (dialogAction.timeSlot === 'all') {
      return dialogAction.action === 'close' 
        ? `${format(selectedDate, 'yyyy-MM-dd')} 전체 예약을 마감하시겠습니까?`
        : `${format(selectedDate, 'yyyy-MM-dd')} 전체 예약을 오픈하시겠습니까?`;
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

  // 수정 모드 시작 함수
  const handleEditStart = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditFormData({...reservation});
  };
  
  // 수정 모드 취소 함수
  const handleEditCancel = () => {
    setEditingReservation(null);
    setEditFormData({});
  };
  
  // 수정 데이터 저장 함수
  const handleEditSave = () => {
    if (!editingReservation || !editFormData) return;
    
    // 필수 필드 체크
    if (!editFormData.name || !editFormData.instName || !editFormData.phone) {
      toast({
        title: '입력 오류',
        description: '모든 필수 정보를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    
    // 숫자 타입 확인 (participants)
    if (typeof editFormData.participants === 'string') {
      editFormData.participants = parseInt(editFormData.participants);
    }
    
    // 원본 데이터와 합치기
    const updatedReservation = {
      ...editingReservation,
      ...editFormData,
      // reservationId를 명시적으로 포함시킴
      reservationId: editingReservation.reservationId
    };
    
    console.log("[디버깅] 수정 요청할 데이터:", updatedReservation);
    console.log("[디버깅] 기존 예약 데이터:", editingReservation);
    console.log("[디버깅] 수정 폼 데이터:", editFormData);
    
    // 뮤테이션 호출
    updateReservationMutation.mutate(updatedReservation);
  };
  
  // 폼 입력값 변경 핸들러
  const handleInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 수정 폼 렌더링 함수
  const renderEditForm = (reservation: Reservation) => {
    return (
      <TableRow key={reservation.id || reservation.reservationId} className="bg-blue-50">
        <TableCell>
          <Input 
            value={editFormData.instName || ''} 
            onChange={(e) => handleInputChange('instName', e.target.value)} 
            className="w-full" 
            placeholder="선생님 이름"
          />
        </TableCell>
        <TableCell>
          <Input 
            value={editFormData.name || ''} 
            onChange={(e) => handleInputChange('name', e.target.value)} 
            className="w-full" 
            placeholder="어린이집/학교명"
          />
        </TableCell>
        <TableCell>
          <Input 
            value={editFormData.phone || ''} 
            onChange={(e) => handleInputChange('phone', e.target.value)} 
            className="w-full" 
            placeholder="연락처"
          />
        </TableCell>
        <TableCell className="text-center">
          <Input 
            type="number" 
            value={editFormData.participants || 0} 
            onChange={(e) => handleInputChange('participants', parseInt(e.target.value) || 0)} 
            className="w-20 mx-auto text-center" 
            min={1}
            max={100}
          />
        </TableCell>
        <TableCell>
          <Select 
            value={editFormData.desiredActivity || 'all'} 
            onValueChange={(value) => handleInputChange('desiredActivity', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="희망 활동" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모두(숲 놀이, 체험 활동)</SelectItem>
              <SelectItem value="experience">체험 활동만</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select 
            value={editFormData.parentParticipation || 'no'} 
            onValueChange={(value) => handleInputChange('parentParticipation', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="학부모 참여 여부" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">아니오 (선생님 및 어린이만 참여)</SelectItem>
              <SelectItem value="yes">예</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-green-50 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={handleEditSave}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-gray-50 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
              onClick={handleEditCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };
  
  // 예약 정보 테이블 렌더링 수정
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
          {reservations.map((reservation) => {
            // 현재 수정 중인 예약인지 확인
            if (editingReservation && 
                (editingReservation.id === reservation.id || 
                 editingReservation.reservationId === reservation.reservationId)) {
              return renderEditForm(reservation);
            }
            
            // 일반 예약 행 렌더링
            return (
              <TableRow key={reservation.id || reservation.reservationId}>
                <TableCell className="font-medium">{reservation.instName}</TableCell>
                <TableCell>{reservation.name}</TableCell>
                <TableCell>{reservation.phone}</TableCell>
                <TableCell className="text-center">{reservation.participants}명</TableCell>
                <TableCell>{getDesiredActivityText(reservation.desiredActivity)}</TableCell>
                <TableCell>{getParentParticipationText(reservation.parentParticipation)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditStart(reservation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleCancelReservation(reservation)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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

  // 예약 취소 처리 함수
  const handleCancelReservation = async (reservation: Reservation) => {
    // 로그 추가 - 예약 정보 확인
    console.log('삭제할 예약 정보:', {
      id: reservation.id,
      reservationId: reservation.reservationId,
      name: reservation.name,
      timeSlot: reservation.timeSlot,
      date: reservation.date
    });
    
    const confirmCancel = window.confirm(`[${reservation.name}] 예약을 삭제하시겠습니까?`);
    if (confirmCancel) {
      try {
        // reservationId가 우선, 없으면 id 사용
        const deleteId = reservation.reservationId || reservation.id;
        
        if (!deleteId) {
          throw new Error('삭제할 예약의 ID가 존재하지 않습니다.');
        }
        
        console.log(`예약 삭제 요청 ID: ${deleteId}`);
        
        const response = await fetch(`/api/reservations/${deleteId}`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });

        // 응답 로그 추가
        console.log('삭제 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('삭제 실패 응답:', errorText);
          throw new Error(`예약 삭제에 실패했습니다. 상태 코드: ${response.status}`);
        }

        toast({
          title: '삭제 완료',
          description: `[${reservation.name}] 예약이 성공적으로 삭제되었습니다.`,
        });
        
        // 데이터 무효화 및 재조회
        queryClient.invalidateQueries({ queryKey: ['reservations', 'all'] });
        queryClient.invalidateQueries({ queryKey: ['availability', selectedDateStr] });
        
        // 캘린더 데이터도 무효화하여 색상 변경이 즉시 반영되도록 함
        queryClient.invalidateQueries({ queryKey: ['availability', yearMonth] });
        queryClient.invalidateQueries({ queryKey: ['reservations', yearMonth] });
      } catch (error) {
        console.error('예약 삭제 에러:', error);
        toast({
          title: '삭제 실패',
          description: error instanceof Error ? error.message : '예약 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    }
  };

  // 날짜 예약 가능 여부 관리 함수들
  const handleToggleAvailability = async (timeSlot: 'morning' | 'afternoon') => {
    if (!availability) {
      alert('가용성 데이터를 불러올 수 없습니다.');
      return;
    }

    const currentValue = timeSlot === 'morning' ? availability.morning.available : availability.afternoon.available;
    
    try {
      const response = await fetch(`/api/availability/date/${selectedDateStr}/${timeSlot}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available: !currentValue }),
      });

      if (!response.ok) {
        throw new Error(`${timeSlot} 예약 가능 여부 변경에 실패했습니다.`);
      }

      // 데이터 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: ['availability', selectedDateStr] });
      
      // 캘린더 데이터도 무효화하여 색상 변경이 즉시 반영되도록 함
      queryClient.invalidateQueries({ queryKey: ['availability', yearMonth] });
      queryClient.invalidateQueries({ queryKey: ['reservations', yearMonth] });
    } catch (error) {
      console.error('예약 가능 여부 변경 에러:', error);
      alert('예약 가능 여부 변경 중 오류가 발생했습니다.');
    }
  };

  // 전체 날짜 열기/닫기 함수
  const handleCloseAllSessions = async () => {
    if (!availability) {
      alert('가용성 데이터를 불러올 수 없습니다.');
      return;
    }

    // 현재 둘 다 닫혀있는지 확인
    const allClosed = !availability.morning.available && !availability.afternoon.available;
    // 모두 열기 또는 닫기 선택
    const shouldOpen = allClosed;

    try {
      const response = await fetch(`/api/availability/date/${selectedDateStr}/all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available: shouldOpen }),
      });

      if (!response.ok) {
        throw new Error('모든 세션 상태 변경에 실패했습니다.');
      }

      // 데이터 무효화 및 재조회 
      queryClient.invalidateQueries({ queryKey: ['availability', selectedDateStr] });
      
      // 캘린더 데이터도 무효화하여 색상 변경이 즉시 반영되도록 함
      queryClient.invalidateQueries({ queryKey: ['availability', yearMonth] });
      queryClient.invalidateQueries({ queryKey: ['reservations', yearMonth] });
    } catch (error) {
      console.error('세션 상태 변경 에러:', error);
      alert('세션 상태 변경 중 오류가 발생했습니다.');
    }
  };

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