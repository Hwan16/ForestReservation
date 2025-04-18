import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Program = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-2">아름 유아숲 체험원 프로그램</h1>
          <p className="text-center text-gray-500 mb-12">자연 속에서 아이들의 창의성과 감수성을 키우는 특별한 경험</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 프로그램 1 */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M9 17l3-3 3 3"></path>
                  <path d="M12 14V6"></path>
                  <path d="M21 12a9 9 0 0 1-18 0c0-1.86.73-3.55 1.91-4.8C6.58 5.66 8.58 4.5 12 3c3.42 1.5 5.42 2.66 7.09 4.2A8.995 8.995 0 0 1 21 12z"></path>
                </svg>
              </div>
              <CardHeader>
                <CardTitle>숲 탐험 프로그램</CardTitle>
                <CardDescription>매일 오전 9:00 - 12:00</CardDescription>
              </CardHeader>
              <CardContent>
                <p>아이들이 숲 속에서 다양한 식물과 생물을 탐색하며 자연의 아름다움을 발견하는 프로그램입니다. 계절별로 다른 숲의 모습을 관찰하고, 자연물을 이용한 창작 활동을 통해 창의력을 키웁니다.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">대상: 5-7세</p>
                <p className="text-sm text-gray-500">정원: 20명</p>
              </CardFooter>
            </Card>
            
            {/* 프로그램 2 */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M5 8h14"></path>
                  <path d="M5 12h14"></path>
                  <path d="M5 16h14"></path>
                  <path d="M3 20h18"></path>
                  <path d="M3 4h18"></path>
                </svg>
              </div>
              <CardHeader>
                <CardTitle>물과 친구들</CardTitle>
                <CardDescription>매일 오후 13:00 - 16:00</CardDescription>
              </CardHeader>
              <CardContent>
                <p>숲 속 작은 개울과 연못에서 수생 식물과 물 생태계를 탐구하는 프로그램입니다. 아이들은 물의 중요성을 배우고 자연 친화적인 물 사용 방법을 익히며 환경 보전 의식을 함양합니다.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">대상: 5-7세</p>
                <p className="text-sm text-gray-500">정원: 20명</p>
              </CardFooter>
            </Card>
            
            {/* 프로그램 3 */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-yellow-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
              <CardHeader>
                <CardTitle>감각의 숲</CardTitle>
                <CardDescription>화, 목, 토 (오전/오후)</CardDescription>
              </CardHeader>
              <CardContent>
                <p>오감을 통해 자연을 느끼는 특별한 체험 프로그램입니다. 숲의 소리를 듣고, 다양한 식물의 향기를 맡으며, 나무와 풀의 질감을 만지는 등 감각을 통해 자연과 교감합니다.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">대상: 5-7세</p>
                <p className="text-sm text-gray-500">정원: 20명</p>
              </CardFooter>
            </Card>
            
            {/* 프로그램 4 */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M12 3c.132.006.263.01.394.013a7.5 7.5 0 0 1 7.92 6.364 10 10 0 1 1-16.626 0A7.5 7.5 0 0 1 11.607 3.013 7.5 7.5 0 0 1 12 3"></path>
                  <path d="M12 3v5"></path>
                  <path d="M12 12h9"></path>
                  <path d="M12 16.5V21"></path>
                </svg>
              </div>
              <CardHeader>
                <CardTitle>계절 변화 관찰</CardTitle>
                <CardDescription>월, 수, 금 (오전/오후)</CardDescription>
              </CardHeader>
              <CardContent>
                <p>계절에 따라 변화하는 숲의 모습을 관찰하고 기록하는 프로그램입니다. 아이들은 자연의 순환과 생명의 변화를 이해하며 자연 환경의 소중함을 배웁니다.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">대상: 5-7세</p>
                <p className="text-sm text-gray-500">정원: 20명</p>
              </CardFooter>
            </Card>
            
            {/* 프로그램 5 */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-purple-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M3 11a8 8 0 0 1 16 0M3 11v3a8 8 0 0 0 16 0v-3"></path>
                  <path d="M10 16.5v1.5"></path>
                  <path d="M14 16.5v1.5"></path>
                  <path d="M8 11h8"></path>
                  <path d="M8 20v1"></path>
                  <path d="M16 20v1"></path>
                </svg>
              </div>
              <CardHeader>
                <CardTitle>숲속 음악회</CardTitle>
                <CardDescription>매주 토요일 특별 프로그램</CardDescription>
              </CardHeader>
              <CardContent>
                <p>자연 속에서 음악을 느끼고 표현하는 특별 프로그램입니다. 아이들은 나뭇가지, 돌, 나뭇잎 등 자연물로 악기를 만들고, 숲의 소리와 함께 특별한 음악회를 열어봅니다.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">대상: 5-7세</p>
                <p className="text-sm text-gray-500">정원: 20명</p>
              </CardFooter>
            </Card>
            
            {/* 프로그램 6 */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-orange-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7-1.39 1.95-3.2 3.68-5.33 4.96"></path>
                  <path d="M4.12 4.12C2.18 5.87 1 8.3 1 12c0 5 3 10 10 10a12.2 12.2 0 0 0 2.95-.36"></path>
                  <path d="M5.58 5.6A9.87 9.87 0 0 0 2 12c0 0 3 7 10 7 1.84 0 3.44-.48 4.78-1.3"></path>
                  <path d="M2 2l20 20"></path>
                </svg>
              </div>
              <CardHeader>
                <CardTitle>생태 보전 교실</CardTitle>
                <CardDescription>특별 교육 프로그램</CardDescription>
              </CardHeader>
              <CardContent>
                <p>생태계 보전의 중요성을 배우는 교육 프로그램입니다. 아이들은 생물 다양성과 환경 보호의 필요성을 이해하고, 실천 방법을 배우며 환경 친화적인 생활 습관을 형성합니다.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">대상: 5-7세</p>
                <p className="text-sm text-gray-500">정원: 20명</p>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-12 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">프로그램 안내</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>모든 프로그램은 사전 예약이 필요합니다.</li>
              <li>프로그램 시작 10분 전까지 입장해 주세요.</li>
              <li>우천 시 실내 프로그램으로 대체될 수 있습니다.</li>
              <li>편안한 복장과 운동화를 착용해 주세요.</li>
              <li>개인 물병, 모자, 썬크림 등을 준비해 주세요.</li>
              <li>상세 문의: 02-123-4567</li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Program;