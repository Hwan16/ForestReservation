import { 
  users, type User, type InsertUser,
  reservations, type Reservation, type InsertReservation,
  availability, type Availability, type InsertAvailability
} from "@shared/schema";
import { format } from "date-fns";

// Define types for day availability
type TimeSlotStatus = {
  available: boolean;
  capacity: number;
  reserved: number;
};

type DayStatus = {
  morning: TimeSlotStatus;
  afternoon: TimeSlotStatus;
};

export type DayAvailability = {
  date: string;
  status: DayStatus;
};

// ?좎쭨? ?쒓컙蹂??덉빟 ?곗씠??export interface Availability {
  id?: number;
  date: string;
  timeSlot: string;
  capacity: number;
  reserved: number;
  available?: boolean; // ?덉빟 媛???щ?瑜?吏곸젒 ?ㅼ젙?????덈뒗 ?꾨뱶 異붽?
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Reservation methods
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getAllReservations(): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | undefined>;
  deleteReservation(id: string): Promise<void>;
  
  // Availability methods
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  getAllAvailabilities(): Promise<Availability[]>;
  getAvailabilitiesByMonth(yearMonth: string): Promise<DayAvailability[]>;
  getAvailabilityByDate(date: string): Promise<DayAvailability | undefined>;
  getAvailabilityByTimeSlot(date: string, timeSlot: string): Promise<Availability | undefined>;
  updateAvailability(
    date: string, 
    timeSlot: string, 
    updateFn: (current: Availability) => Availability
  ): Promise<Availability>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reservations: Map<string, Reservation>;
  private availabilities: Map<string, Availability>;
  
  private userIdCounter: number;
  private availabilityIdCounter: number;
  private reservationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.reservations = new Map();
    this.availabilities = new Map();
    
    this.userIdCounter = 1;
    this.availabilityIdCounter = 1;
    this.reservationIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Reservation methods
  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const id = this.reservationIdCounter++;
    const reservation: Reservation = { ...insertReservation, id };
    this.reservations.set(reservation.reservationId, reservation);
    return reservation;
  }

  async getAllReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async deleteReservation(id: string): Promise<void> {
    this.reservations.delete(id);
  }

  // Availability methods
  async createAvailability(data: {
    date: string;
    timeSlot: string;
    capacity: number;
    reserved: number;
    available?: boolean;
  }): Promise<Availability> {
    const id = this.availabilityIdCounter++;
    const availability = {
      id,
      date: data.date,
      timeSlot: data.timeSlot,
      capacity: data.capacity,
      reserved: data.reserved,
      available: data.available !== undefined ? data.available : true, // 湲곕낯媛믪? true(?댁슜 媛??
    };
    
    const key = `${data.date}_${data.timeSlot}`;
    this.availabilities.set(key, availability);
    
    return availability;
  }

  async getAllAvailabilities(): Promise<Availability[]> {
    return Array.from(this.availabilities.values());
  }

  async getAvailabilitiesByMonth(yearMonth: string): Promise<DayAvailability[]> {
    const allAvailabilities = Array.from(this.availabilities.values());
    
    // Group by date
    const availabilityMap = new Map<string, Availability[]>();
    
    allAvailabilities.forEach(availability => {
      if (availability.date.startsWith(yearMonth)) {
        const existingGroup = availabilityMap.get(availability.date) || [];
        existingGroup.push(availability);
        availabilityMap.set(availability.date, existingGroup);
      }
    });
    
    // Convert to DayAvailability format
    const result: DayAvailability[] = [];
    
    availabilityMap.forEach((availabilities, date) => {
      const morning = availabilities.find(a => a.timeSlot === "morning");
      const afternoon = availabilities.find(a => a.timeSlot === "afternoon");
      
      // Date 媛앹껜濡?蹂?섑븯???붿씪 ?뺤씤 (?쇱슂??= 0)
      const dayOfWeek = new Date(date).getDay();
      // ?쇱슂??0)??寃쎌슦 臾댁“嫄??덉빟 遺덇???      const isSunday = dayOfWeek === 0;
      
      result.push({
        date,
        status: {
          morning: morning ? {
            // 愿由ъ옄媛 ?ㅼ젙??available 媛믪씠 ?덉쑝硫?洹?媛믪쓣 ?곗꽑 ?ъ슜, ?놁쑝硫?湲곗〈 濡쒖쭅 ?곸슜
            available: morning.available !== undefined ? morning.available : (!isSunday && morning.capacity > morning.reserved),
            capacity: morning.capacity,
            reserved: morning.reserved,
          } : {
            available: false,
            capacity: 0,
            reserved: 0,
          },
          afternoon: afternoon ? {
            // 愿由ъ옄媛 ?ㅼ젙??available 媛믪씠 ?덉쑝硫?洹?媛믪쓣 ?곗꽑 ?ъ슜, ?놁쑝硫?湲곗〈 濡쒖쭅 ?곸슜
            available: afternoon.available !== undefined ? afternoon.available : (!isSunday && afternoon.capacity > afternoon.reserved),
            capacity: afternoon.capacity,
            reserved: afternoon.reserved,
          } : {
            available: false,
            capacity: 0,
            reserved: 0,
          },
        },
      });
    });
    
    return result;
  }

  async getAvailabilityByDate(date: string): Promise<DayAvailability | undefined> {
    const morning = this.availabilities.get(`${date}_morning`);
    const afternoon = this.availabilities.get(`${date}_afternoon`);
    
    if (!morning && !afternoon) {
      return undefined;
    }
    
    // Date 媛앹껜濡?蹂?섑븯???붿씪 ?뺤씤 (?쇱슂??= 0)
    const dayOfWeek = new Date(date).getDay();
    console.log(`getAvailabilityByDate - date: ${date}, day: ${dayOfWeek}`);
    
    // ?쇱슂??0)??寃쎌슦 臾댁“嫄??덉빟 遺덇???    const isSunday = dayOfWeek === 0;
    
    return {
      date,
      status: {
        morning: morning ? {
          // 愿由ъ옄媛 ?ㅼ젙??available 媛믪씠 ?덉쑝硫?洹?媛믪쓣 ?곗꽑 ?ъ슜, ?놁쑝硫?湲곗〈 濡쒖쭅 ?곸슜
          available: morning.available !== undefined ? morning.available : (!isSunday && morning.capacity > morning.reserved),
          capacity: morning.capacity,
          reserved: morning.reserved,
        } : {
          available: false,
          capacity: 0,
          reserved: 0,
        },
        afternoon: afternoon ? {
          // 愿由ъ옄媛 ?ㅼ젙??available 媛믪씠 ?덉쑝硫?洹?媛믪쓣 ?곗꽑 ?ъ슜, ?놁쑝硫?湲곗〈 濡쒖쭅 ?곸슜
          available: afternoon.available !== undefined ? afternoon.available : (!isSunday && afternoon.capacity > afternoon.reserved),
          capacity: afternoon.capacity,
          reserved: afternoon.reserved,
        } : {
          available: false,
          capacity: 0,
          reserved: 0,
        },
      },
    };
  }

  // ?좎쭨? ?쒓컙?濡?媛?⑹꽦 ?곗씠??議고쉶
  async getAvailabilityByTimeSlot(date: string, timeSlot: string): Promise<Availability | undefined> {
    const key = `${date}_${timeSlot}`;
    return this.availabilities.get(key);
  }

  async updateAvailability(
    date: string, 
    timeSlot: string, 
    updateFn: (current: Availability) => Availability
  ): Promise<Availability> {
    const key = `${date}_${timeSlot}`;
    const currentAvailability = this.availabilities.get(key);
    
    if (!currentAvailability) {
      throw new Error(`Availability for ${date} ${timeSlot} not found`);
    }
    
    const updatedAvailability = updateFn(currentAvailability);
    this.availabilities.set(key, updatedAvailability);
    
    return updatedAvailability;
  }
}

export const storage = new MemStorage();
