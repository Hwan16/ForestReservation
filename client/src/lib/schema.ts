import { z } from "zod";

// Extended schemas for validation (클라이언트용 복사본)
export const createReservationSchema = z.object({
  date: z.string(),
  timeSlot: z.enum(["morning", "afternoon"]),
  name: z.string().min(1, "어린이집/유치원 이름은 필수 입력 항목입니다."),
  instName: z.string().min(1, "원장님/선생님 성함은 필수 입력 항목입니다."),
  phone: z.string().min(1, "연락처는 필수 입력 항목입니다."),
  participants: z.number({
    required_error: "인원수는 필수 입력 항목입니다.",
    invalid_type_error: "인원수는 숫자로 입력해야 합니다."
  }).min(1, "최소 1명 이상이어야 합니다.").max(30, "최대 30명까지 예약 가능합니다."),
  desiredActivity: z.enum(["all", "experience"], {
    required_error: "희망 활동을 선택해주세요.",
    invalid_type_error: "잘못된 활동 유형입니다."
  }),
  parentParticipation: z.enum(["yes", "no"], {
    required_error: "학부모 참여 여부를 선택해주세요."
  }),
});

export const loginSchema = z.object({
  username: z.string().min(1, "사용자 이름은 필수 입력 항목입니다."),
  password: z.string().min(1, "비밀번호는 필수 입력 항목입니다.")
});
