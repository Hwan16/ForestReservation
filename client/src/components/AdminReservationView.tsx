import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Reservation } from '../types';
import { Loader2, Edit, Trash2, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

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
    name: raw.name,
    instName: raw.inst_name,
    phone: raw.phone,
    participants: raw.participants,
    desiredActivity: raw.desired_activity as any,
    parentParticipation: raw.parent_participation as any,
    timestamp: raw.created_at
  };
};

const AdminReservationView: React.FC<AdminReservationViewProps> = ({ selectedDate }) => {
  // 해당 날짜의 예약 정보 가져오기
  const { data: allReservations, isLoading, refetch } = useQuery<Reservation[]>({
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
  const reservations = allReservations?.filter(res => res.date === selectedDateStr) || [];

  // 주기적으로 데이터 새로고침 (3초마다)
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);

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
            <TableHead>어린이집/학교명</TableHead>
            <TableHead>선생님 이름</TableHead>
            <TableHead>연락처</TableHead>
            <TableHead className="text-center">인원수</TableHead>
            <TableHead>희망 활동</TableHead>
            <TableHead>학부모 참여</TableHead>
            <TableHead className="text-right">관리</TableHead>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">예약 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 오전 예약 */}
      <Card>
        <CardHeader className="bg-amber-50 border-b">
          <CardTitle className="text-xl text-amber-800">
            오전 예약 현황
            <span className="ml-2 text-sm font-normal text-amber-600">
              {morningTotalTeams}팀 / {morningTotalParticipants}명
            </span>
          </CardTitle>
          <CardDescription>
            오전 10:00 ~ 12:00 예약된 정보입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {renderReservationTable(morningReservations)}
        </CardContent>
      </Card>

      {/* 오후 예약 */}
      <Card>
        <CardHeader className="bg-sky-50 border-b">
          <CardTitle className="text-xl text-sky-800">
            오후 예약 현황
            <span className="ml-2 text-sm font-normal text-sky-600">
              {afternoonTotalTeams}팀 / {afternoonTotalParticipants}명
            </span>
          </CardTitle>
          <CardDescription>
            오후 14:00 ~ 16:00 예약된 정보입니다.
          </CardDescription>
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
    </div>
  );
};

export default AdminReservationView; 