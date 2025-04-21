import React from "react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { Reservation } from "../types";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import ReservationItem from './ReservationItem.tsx';

interface ConfirmationProps {
  reservation: Reservation;
}

const Confirmation = ({ reservation }: ConfirmationProps) => {
  // 시간대에 따라 다른 텍스트와 스타일 적용
  const timeLabel = reservation.timeSlot === "morning" 
    ? "오전반 (09:00 - 13:00)" 
    : <span className="text-blue-600 font-medium">오후반 (14:00 - 18:00)</span>;
  
  // 희망 활동 표시
  const activityLabel = reservation.desiredActivity === "all"
    ? "모두(숲 놀이, 체험 활동)"
    : "체험 활동만";
  
  // 학부모 참여 여부 표시
  const parentParticipationLabel = reservation.parentParticipation === "yes"
    ? "예"
    : "아니오 (선생님 및 어린이만 참여)";
  
  const reservationDate = new Date(reservation.date);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="text-green-600 h-10 w-10" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">예약이 완료되었습니다!</h2>
      <p className="text-gray-600 mb-2">상단의 마이페이지에서 예약 내역 확인이 가능합니다.</p>
      <div className="bg-gray-50 rounded-lg p-4 my-4 inline-block text-left">
        <p className="mb-2"><span className="font-medium">예약 일자 및 시간:</span> {formatDate(reservationDate)} / {timeLabel}</p>
        <p className="mb-2"><span className="font-medium">어린이집/유치원 이름:</span> {reservation.name}</p>
        <p className="mb-2"><span className="font-medium">원장님/선생님 성함:</span> {reservation.instName}</p>
        <p className="mb-2"><span className="font-medium">연락처:</span> {reservation.phone}</p>
        <p className="mb-2"><span className="font-medium">참여 어린이 인원수:</span> {reservation.participants}명</p>
        <p className="mb-2"><span className="font-medium">희망 활동:</span> {activityLabel}</p>
        <p><span className="font-medium">학부모 참여 여부:</span> {parentParticipationLabel}</p>
      </div>
      <div className="mt-16">
        <Button 
          onClick={() => window.location.href = '/'} 
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
