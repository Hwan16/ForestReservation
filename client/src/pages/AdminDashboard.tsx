import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Reservation } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminDashboard = () => {
  const [, setLocation] = useLocation();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check if user is authenticated
  const { data: user, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ['/api/auth/me'],
    onError: () => {
      toast({
        title: '인증 오류',
        description: '관리자 로그인이 필요합니다.',
        variant: 'destructive',
      });
      setLocation('/');
    },
  });

  // Get all reservations
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/all'],
    enabled: !!user,
  });

  // Delete reservation mutation
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

  // Logout mutation
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

  // Handle delete confirmation
  const confirmDelete = () => {
    if (selectedReservation) {
      deleteReservation(selectedReservation.id);
    }
  };

  // Filter reservations by date
  const todayReservations = reservations?.filter(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  ) || [];

  const upcomingReservations = reservations?.filter(
    (r) => new Date(r.date) > new Date()
  ) || [];

  const pastReservations = reservations?.filter(
    (r) => new Date(r.date) < new Date() && new Date(r.date).toDateString() !== new Date().toDateString()
  ) || [];

  // Get time slot display text
  const getTimeSlotText = (timeSlot: string) => {
    return timeSlot === 'morning' ? '오전 (09:00 - 12:00)' : '오후 (13:00 - 16:00)';
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (authError) {
    return null; // Will redirect via the onError callback
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">아름유아 숲 체험원 - 관리자</h1>
          <Button variant="outline" onClick={() => logout()}>
            로그아웃
          </Button>
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
                isLoading={isLoading} 
                onDeleteClick={(reservation) => {
                  setSelectedReservation(reservation);
                  setShowDeleteDialog(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="upcoming">
              <ReservationTable 
                reservations={upcomingReservations} 
                isLoading={isLoading}
                onDeleteClick={(reservation) => {
                  setSelectedReservation(reservation);
                  setShowDeleteDialog(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="past">
              <ReservationTable 
                reservations={pastReservations} 
                isLoading={isLoading}
                onDeleteClick={(reservation) => {
                  setSelectedReservation(reservation);
                  setShowDeleteDialog(true);
                }}
              />
            </TabsContent>
            
            <TabsContent value="all">
              <ReservationTable 
                reservations={reservations || []} 
                isLoading={isLoading}
                onDeleteClick={(reservation) => {
                  setSelectedReservation(reservation);
                  setShowDeleteDialog(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
};

interface ReservationTableProps {
  reservations: Reservation[];
  isLoading: boolean;
  onDeleteClick: (reservation: Reservation) => void;
}

const ReservationTable = ({ reservations, isLoading, onDeleteClick }: ReservationTableProps) => {
  // Sort reservations by date (newest first)
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
