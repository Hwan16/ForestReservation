import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StepsIndicator from "@/components/StepsIndicator";
import Calendar from "@/components/Calendar";
import TimeSelection from "@/components/TimeSelection";
import ReservationForm from "@/components/ReservationForm";
import Confirmation from "@/components/Confirmation";
import { Step, TimeSlot, Reservation } from "../types";

const Home = () => {
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);

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
              <Calendar 
                onSelectDate={handleDateSelect}
                selectedDate={selectedDate}
              />
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
