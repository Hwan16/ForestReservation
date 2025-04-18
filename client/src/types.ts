export type TimeSlot = "morning" | "afternoon";

export type Reservation = {
  id: string;
  date: string;
  timeSlot: TimeSlot;
  name: string;
  phone: string;
  email?: string;
  participants: number;
  notes?: string;
  createdAt: string;
};

export type AvailabilityStatus = {
  morning: {
    available: boolean;
    capacity: number;
    reserved: number;
  };
  afternoon: {
    available: boolean;
    capacity: number;
    reserved: number;
  };
};

export type DayAvailability = {
  date: string;
  status: AvailabilityStatus;
};

export type Step = "date" | "time" | "info" | "confirmation";
