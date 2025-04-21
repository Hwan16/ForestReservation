import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Reservation } from "../types";

// 마이페이지 검색 스키마
const searchSchema = z.object({
  name: z.string().min(2, "이름을 2글자 이상 입력해주세요"),
  phone: z.string().min(10, "전화번호를 정확히 입력해주세요"),
});

type SearchValues = z.infer<typeof searchSchema>;

const MyPage = () => {
  const [searchParams, setSearchParams] = useState<SearchValues | null>(null);

  const form = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // 예약 정보 조회 쿼리
  const { data: reservations, isLoading, isError } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/search', searchParams],
    queryFn: async () => {
      if (!searchParams) return [];
      
      const response = await fetch(`/api/reservations/search?name=${encodeURIComponent(searchParams.name)}&phone=${encodeURIComponent(searchParams.phone)}`);
      
      if (!response.ok) {
        throw new Error("예약 정보를 불러오는데 실패했습니다.");
      }
      
      return await response.json();
    },
    enabled: !!searchParams,
  });

  // 검색 폼 제출 핸들러
  const onSubmit = (values: SearchValues) => {
    setSearchParams(values);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">마이페이지</h1>
          <Card>
            <CardHeader>
              <CardTitle>예약 조회</CardTitle>
              <CardDescription>예약자 정보를 입력하여 예약 내역을 조회하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이름</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="예약자 이름" />
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
                          <FormLabel>전화번호</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="01012345678" type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "조회중..." : "예약 조회하기"}
                  </Button>
                </form>
              </Form>
              
              {searchParams && (
                <div className="mt-8">
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold mb-4">조회 결과</h3>
                  
                  {isLoading ? (
                    <p className="text-center py-4">로딩 중...</p>
                  ) : isError ? (
                    <p className="text-center py-4 text-red-500">예약 정보를 불러오는데 실패했습니다.</p>
                  ) : reservations && reservations.length > 0 ? (
                    <div className="space-y-4">
                      {reservations.map((reservation) => (
                        <Card key={reservation.id} className="overflow-hidden">
                          <div className="bg-primary text-white py-2 px-4">
                            <p className="font-semibold">예약 정보</p>
                          </div>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2">
                                <p className="text-sm text-gray-500">예약일 및 시간</p>
                                <p>
                                  {formatDate(new Date(reservation.date))} / {' '}
                                  {reservation.timeSlot === 'morning' 
                                    ? '오전반 (09:00 - 13:00)' 
                                    : <span className="text-blue-600 font-medium">오후반 (14:00 - 18:00)</span>}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">어린이집/유치원</p>
                                <p>{reservation.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">담당자</p>
                                <p>{reservation.instName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">참여 인원</p>
                                <p>{reservation.participants}명</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-gray-500">전화번호</p>
                                <p>{reservation.phone}</p>
                              </div>
                              {reservation.notes && (
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">요청사항</p>
                                  <p>{reservation.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4">예약 내역이 없습니다.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyPage;