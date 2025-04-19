import { format } from 'date-fns';
import { Reservation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';

interface ReservationDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  reservations: Reservation[];
  onManageTimeSlot: (date: Date, timeSlot: 'morning' | 'afternoon') => void;
  onDeleteReservation: (reservation: Reservation) => void;
}

const ReservationDetailDialog = ({
  isOpen,
  onClose,
  date,
  reservations,
  onManageTimeSlot,
  onDeleteReservation
}: ReservationDetailDialogProps) => {
  if (!date) return null;
  
  const morningReservations = reservations.filter(r => r.timeSlot === 'morning');
  const afternoonReservations = reservations.filter(r => r.timeSlot === 'afternoon');
  
  const morningTotal = morningReservations.reduce((sum, res) => sum + res.participants, 0);
  const afternoonTotal = afternoonReservations.reduce((sum, res) => sum + res.participants, 0);
  
  const ReservationTable = ({ reservations }: { reservations: Reservation[] }) => {
    if (reservations.length === 0) {
      return (
        <div className="text-center py-8 bg-slate-50 rounded-md">
          <p className="text-gray-500">신청 정보가 없습니다</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead>기관명</TableHead>
            <TableHead>담당자</TableHead>
            <TableHead>전화번호</TableHead>
            <TableHead>인원</TableHead>
            <TableHead>관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation, index) => (
            <TableRow key={reservation.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{reservation.name}</TableCell>
              <TableCell>{reservation.instName}</TableCell>
              <TableCell>{reservation.phone}</TableCell>
              <TableCell>{reservation.participants}명</TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onDeleteReservation(reservation)}
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {formatDate(date)} 예약 목록
          </DialogTitle>
          <DialogDescription>
            선택한 날짜의 모든 예약 정보입니다. 예약은 오전반과 오후반으로 구분됩니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="morning">
            <TabsList className="w-full">
              <TabsTrigger value="morning" className="flex-1">
                <div className="flex items-center">
                  <span className="font-semibold">오전반</span>
                  <Badge className="ml-2" variant="outline">09:00 - 13:00</Badge>
                  <Badge className="ml-2" variant="secondary">{morningReservations.length}팀 / {morningTotal}명</Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger value="afternoon" className="flex-1">
                <div className="flex items-center">
                  <span className="font-semibold">오후반</span>
                  <Badge className="ml-2" variant="outline">14:00 - 18:00</Badge>
                  <Badge className="ml-2" variant="secondary">{afternoonReservations.length}팀 / {afternoonTotal}명</Badge>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="morning" className="mt-4">
              <div className="bg-white rounded-md border p-4">
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onManageTimeSlot(date, 'morning')}
                  >
                    예약 설정
                  </Button>
                </div>
                <ReservationTable reservations={morningReservations} />
              </div>
            </TabsContent>
            
            <TabsContent value="afternoon" className="mt-4">
              <div className="bg-white rounded-md border p-4">
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onManageTimeSlot(date, 'afternoon')}
                  >
                    예약 설정
                  </Button>
                </div>
                <ReservationTable reservations={afternoonReservations} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationDetailDialog;