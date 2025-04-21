import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StepsIndicator from "@/components/StepsIndicator";
import Calendar from "@/components/Calendar";
import TimeSelection from "@/components/TimeSelection";
import ReservationForm from "@/components/ReservationForm";
import Confirmation from "@/components/Confirmation";
import { Step, TimeSlot, Reservation } from "../types";
import { isAuthenticated } from "@/utils/auth";
import { useLocation } from "wouter";

const Home = () => {
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [_, setLocation] = useLocation();
  
  // 관리자 인증 여부 확인 및 관리자 페이지로 리디렉션
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = isAuthenticated();
      setIsAdmin(adminStatus);
      
      // 관리자로 로그인된 상태라면 관리자 페이지로 리디렉션
      if (adminStatus) {
        setLocation('/admin');
      }
    };
    
    // 초기 확인
    checkAdminStatus();
    
    // 1초마다 인증 상태 확인
    const intervalId = setInterval(checkAdminStatus, 1000);
    
    return () => clearInterval(intervalId);
  }, [setLocation]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep("time");
  };

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    setSelectedTime(timeSlot);
    setCurrentStep("info");
  };

  const handleReservationComplete = (reservation: Reservation) => {
    setReservation(reservation);
    setCurrentStep("confirmation");
  };

  const handleBackToDate = () => {
    setCurrentStep("date");
  };

  const handleBackToTime = () => {
    setCurrentStep("time");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 pb-12">
          <StepsIndicator currentStep={currentStep} />
          
          <div className="max-w-3xl mx-auto">
            {currentStep === "date" && (
              <>
                {console.log("Home - isAdmin:", isAdmin)}
                <Calendar 
                  onSelectDate={handleDateSelect}
                  selectedDate={selectedDate}
                  isAdminMode={isAdmin}
                />
              </>
            )}

            {currentStep === "time" && selectedDate && (
              <TimeSelection 
                selectedDate={selectedDate}
                onSelectTime={handleTimeSelect}
                onBack={handleBackToDate}
              />
            )}

            {currentStep === "info" && selectedDate && selectedTime && (
              <ReservationForm 
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onBack={handleBackToTime}
                onComplete={handleReservationComplete}
              />
            )}

            {currentStep === "confirmation" && reservation && (
              <Confirmation 
                reservation={reservation}
              />
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
