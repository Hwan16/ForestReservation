import React from 'react';
import { Reservation } from '../types';
import { School, User, Phone, Users, Bookmark, Info, Trash2, Edit } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ReservationItemProps {
  reservation: Reservation;
  isAdminMode?: boolean;
}

const ReservationItem = ({ reservation, isAdminMode = false }: ReservationItemProps) => {
  const handleEdit = () => {
    // 수정 기능 구현
    console.log('Edit reservation:', reservation.id);
  };

  const handleDelete = () => {
    // 삭제 기능 구현
    console.log('Delete reservation:', reservation.id);
    if (confirm('이 예약을 정말 삭제하시겠습니까?')) {
      // 삭제 API 호출
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between mb-3">
        <div className="flex items-center mb-2 sm:mb-0">
          <School className="w-4 h-4 mr-2 text-primary" />
          <h3 className="font-semibold text-gray-800">{reservation.instName}</h3>
          
          <Badge variant="outline" className="ml-3">
            {reservation.timeSlot === 'morning' ? '오전반 (09:00-13:00)' : '오후반 (14:00-18:00)'}
          </Badge>
        </div>
        
        {isAdminMode && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center" 
              onClick={handleEdit}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              수정
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-red-500 border-red-200 hover:bg-red-50" 
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              삭제
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="flex items-center text-sm">
          <User className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-600">담당자: </span>
          <span className="ml-1 font-medium">{reservation.name}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Phone className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-600">연락처: </span>
          <span className="ml-1 font-medium">{reservation.phone}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-600">인원수: </span>
          <span className="ml-1 font-medium">{reservation.participants}명</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Bookmark className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-600">희망 활동: </span>
          <span className="ml-1 font-medium">
            {reservation.desiredActivity === 'all' ? '모두(숲 놀이, 체험 활동)' : '체험 활동만'}
          </span>
        </div>
        
        <div className="flex items-center text-sm col-span-2">
          <Info className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-600">학부모 참여: </span>
          <span className="ml-1 font-medium">
            {reservation.parentParticipation === 'yes' ? '예' : '아니오 (선생님 및 어린이만 참여)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReservationItem; 