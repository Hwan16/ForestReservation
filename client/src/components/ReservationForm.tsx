import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatDateForApi } from "@/lib/utils";
import { TimeSlot, Reservation } from "../types";
import { createReservationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface ReservationFormProps {
  selectedDate: Date;
  selectedTime: TimeSlot;
  onBack: () => void;
  onComplete: (reservation: Reservation) => void;
}

const ReservationForm = ({ selectedDate, selectedTime, onBack, onComplete }: ReservationFormProps) => {
  const timeLabel = selectedTime === "morning" ? 
    "오전반 (09:00 - 13:00)" : 
    <span className="text-blue-600 font-medium">오후반 (14:00 - 18:00)</span>;
  
  const form = useForm({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      date: formatDateForApi(selectedDate),
      timeSlot: selectedTime,
      name: "",
      instName: "",
      phone: "",
      participants: 10,
      notes: "",
    },
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "예약이 완료되었습니다!",
        description: "예약 정보가 등록되었습니다.",
      });
      onComplete(data);
    },
    onError: (error) => {
      toast({
        title: "예약 오류",
        description: `예약 중 오류가 발생했습니다: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!termsAccepted) {
      toast({
        title: "약관 동의 필요",
        description: "개인정보 수집 및 이용에 동의해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    // 필수 필드 유효성 검사
    if (!data.name) {
      toast({
        title: "입력 오류",
        description: "어린이집/유치원 이름은 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.instName) {
      toast({
        title: "입력 오류",
        description: "원장님/선생님 성함은 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.phone) {
      toast({
        title: "입력 오류",
        description: "연락처는 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (data.participants === '' || data.participants === undefined || data.participants < 1) {
      toast({
        title: "입력 오류",
        description: "인원수는 최소 1명 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }
    
    mutate(data);
  };

  const increaseParticipants = () => {
    const current = form.getValues("participants");
    if (current < 20) {
      form.setValue("participants", current + 1);
    }
  };

  const decreaseParticipants = () => {
    const current = form.getValues("participants");
    if (current >= 1) {
      form.setValue("participants", current - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl font-semibold text-neutral-dark mb-4">예약 정보 입력</h2>
      <p className="mb-4">
        선택하신 날짜 및 시간: <span className="font-medium">{formatDate(selectedDate)} / {timeLabel}</span>
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>어린이집/유치원 이름 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="instName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>원장님/선생님 성함 *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연락처 * <span className="text-sm text-gray-500 font-normal">(숫자만 입력)</span></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="01012345678" inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="participants"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>인원수 *</FormLabel>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decreaseParticipants}
                    className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-100 hover:bg-gray-200"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-4 h-4"
                    >
                      <path d="M5 12h14"/>
                    </svg>
                  </Button>
                  <FormControl>
                    <Input 
                      type="number" 
                      className="w-16 text-center border-t border-b border-gray-300 py-1 rounded-none"
                      value={value}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                        onChange(val);
                      }}
                      min={0}
                      max={20}
                      {...rest}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={increaseParticipants}
                    className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-4 h-4"
                    >
                      <path d="M5 12h14"/>
                      <path d="M12 5v14"/>
                    </svg>
                  </Button>

                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          

          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>특이사항 (선택)</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex items-start mb-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-1"
            />
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700">개인정보 수집 및 이용에 동의합니다 *</label>
              <p className="text-gray-500">제공하신 정보는 예약 확인 및 관리 목적으로만 사용되며, 체험 이후 바로 폐기됩니다.</p>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="px-4 py-2 text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors"
            >
              이전으로
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              {isPending ? "처리 중..." : "예약하기"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ReservationForm;
