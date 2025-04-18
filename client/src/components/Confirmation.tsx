import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { Reservation } from "../types";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ConfirmationProps {
  reservation: Reservation;
}

const Confirmation = ({ reservation }: ConfirmationProps) => {
  const timeLabel = reservation.timeSlot === "morning" 
    ? "오전 (09:00 - 12:00)" 
    : "오후 (13:00 - 16:00)";
  
  const reservationDate = new Date(reservation.date);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="text-green-600 h-10 w-10" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">예약이 완료되었습니다!</h2>
      <p className="text-gray-600 mb-2">예약 상세정보가 문자로 발송되었습니다.</p>
      <div className="bg-gray-50 rounded-lg p-4 my-4 inline-block text-left">
        <p className="mb-2"><span className="font-medium">예약 일자:</span> {formatDate(reservationDate)}</p>
        <p className="mb-2"><span className="font-medium">예약 시간:</span> {timeLabel}</p>
        <p className="mb-2"><span className="font-medium">이름:</span> {reservation.name}</p>
        <p className="mb-2"><span className="font-medium">연락처:</span> {reservation.phone}</p>
        <p><span className="font-medium">인원수:</span> {reservation.participants}명</p>
      </div>
      <p className="text-gray-600 mb-6">예약번호: <span className="font-semibold">{reservation.id}</span></p>
      <Link href="/">
        <Button className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  );
};

export default Confirmation;
