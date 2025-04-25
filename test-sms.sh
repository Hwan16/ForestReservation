#!/bin/bash

# 예약 생성 테스트를 위한 curl 명령어
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-05-20",
    "timeSlot": "morning",
    "name": "김테스트",
    "instName": "테스트유치원",
    "phone": "01012345678",
    "participants": 20,
    "desiredActivity": "all",
    "parentParticipation": "yes"
  }'

echo -e "\n\n테스트 완료! 서버 로그에서 SMS 발송 결과를 확인하세요." 