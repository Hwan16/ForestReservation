import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import {
  Reservation,
  InsertReservation,
  Availability,
  InsertAvailability,
  availability,
  reservations,
  User,
  InsertUser,
  users,
  files,
  File,
  InsertFile
} from "../shared/schema";
import { withRetry, transaction } from "./db-helper";
import { format, parse, addDays } from "date-fns";
import { PostgrestError } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Check for required environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Mapping between camelCase model fields and snake_case database fields
 */
type FieldMappings = {
  [key: string]: string;
};

// User field mappings
const userFieldMappings: FieldMappings = {
  isAdmin: "is_admin",
  resetToken: "reset_token",
  resetTokenExpiry: "reset_token_expiry"
};

// Reservation field mappings
const reservationFieldMappings: FieldMappings = {
  reservationId: "reservation_id",
  timeSlot: "time_slot",
  instName: "inst_name",
  desiredActivity: "desired_activity",
  parentParticipation: "parent_participation",
  createdAt: "created_at"
};

// Availability field mappings
const availabilityFieldMappings: FieldMappings = {
  timeSlot: "time_slot"
};

// File field mappings
const fileFieldMappings: FieldMappings = {
  contentType: "content_type",
  relatedId: "related_id",
  relatedType: "related_type",
  createdAt: "created_at"
};

/**
 * Convert a user object from camelCase to snake_case
 */
function convertUserToSnakeCase(user: Partial<InsertUser>): Database['public']['Tables']['users']['Insert'] {
  const result: Partial<Database['public']['Tables']['users']['Insert']> = {};
  
  for (const [key, value] of Object.entries(user)) {
    const snakeKey = userFieldMappings[key] || key;
    // Use type assertion to handle any potential type mismatches
    (result as any)[snakeKey] = value;
  }
  
  return result as Database['public']['Tables']['users']['Insert'];
}

/**
 * Convert a reservation object from camelCase to snake_case
 */
function convertReservationToSnakeCase(reservation: Partial<InsertReservation>): Database['public']['Tables']['reservations']['Insert'] {
  const result: Partial<Database['public']['Tables']['reservations']['Insert']> = {};
  
  for (const [key, value] of Object.entries(reservation)) {
    const snakeKey = reservationFieldMappings[key] || key;
    // Use type assertion to handle any potential type mismatches
    (result as any)[snakeKey] = value;
  }
  
  return result as Database['public']['Tables']['reservations']['Insert'];
}

/**
 * Convert an availability object from camelCase to snake_case
 */
function convertAvailabilityToSnakeCase(availability: Partial<InsertAvailability>): Database['public']['Tables']['availability']['Insert'] {
  const result: Partial<Database['public']['Tables']['availability']['Insert']> = {};
  
  for (const [key, value] of Object.entries(availability)) {
    // Special handling for timeSlot -> time_slot
    if (key === 'timeSlot') {
      (result as any)['time_slot'] = value;
    } else {
      const snakeKey = availabilityFieldMappings[key] || key;
      // Use type assertion to handle any potential type mismatches
      (result as any)[snakeKey] = value;
    }
  }
  
  return result as Database['public']['Tables']['availability']['Insert'];
}

/**
 * Convert a file object from camelCase to snake_case
 */
function convertFileToSnakeCase(file: Partial<InsertFile>): any {
  // Since files table doesn't seem to be in the Supabase types, we use any
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(file)) {
    const snakeKey = fileFieldMappings[key] || key;
    result[snakeKey] = value;
  }
  
  return result;
}

// Users
// =========================================================

export async function getUserById(id: number) {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
  });
}

export async function getUserByEmail(email: string) {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
  });
}

export async function getUserByUsername(username: string) {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
  });
}

export async function createUser(user: InsertUser) {
  return withRetry(async () => {
    const snakeCaseUser = convertUserToSnakeCase(user);
    return await supabase
      .from("users")
      .insert(snakeCaseUser)
      .select()
      .single();
  });
}

export async function updateUser(id: number, user: Partial<InsertUser>) {
  return withRetry(async () => {
    const snakeCaseUser = convertUserToSnakeCase(user);
    return await supabase
      .from("users")
      .update(snakeCaseUser)
      .eq("id", id)
      .select()
      .single();
  });
}

export async function deleteUser(id: number) {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .delete()
      .eq("id", id);
  });
}

export async function getAllUsers() {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .select("*")
      .order("id", { ascending: true });
  });
}

// Reset Token Functions
export async function getUserByResetToken(token: string) {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .select("*")
      .eq("reset_token", token)
      .gt("reset_token_expiry", new Date().toISOString())
      .single();
  });
}

export async function clearResetToken(id: number) {
  return withRetry(async () => {
    return await supabase
      .from("users")
      .update({
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq("id", id);
  });
}

// Reservations
// =========================================================

export async function createReservation(reservation: Omit<InsertReservation, "reservationId">) {
  const reservationId = nanoid(10);
  
  return withRetry(async () => {
    const snakeCaseReservation = convertReservationToSnakeCase({ ...reservation, reservationId });
    return await supabase
      .from("reservations")
      .insert(snakeCaseReservation)
      .select()
      .single();
  });
}

export async function getReservationById(id: number) {
  return withRetry(async () => {
    return await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();
  });
}

export async function getReservationByReservationId(reservationId: string) {
  return withRetry(async () => {
    return await supabase
      .from("reservations")
      .select("*")
      .eq("reservation_id", reservationId)
      .single();
  });
}

export async function getAllReservations() {
  return withRetry(async () => {
    return await supabase
      .from("reservations")
      .select("*")
      .order("id", { ascending: false });
  });
}

export async function getReservationsByDate(date: string) {
  return withRetry(async () => {
    return await supabase
      .from("reservations")
      .select("*")
      .eq("date", date)
      .order("id", { ascending: true });
  });
}

export async function getReservationsByDateAndTimeSlot(date: string, timeSlot: string) {
  return withRetry(async () => {
    return await supabase
      .from("reservations")
      .select("*")
      .eq("date", date)
      .eq("time_slot", timeSlot)
      .order("id", { ascending: true });
  });
}

export async function updateReservation(id: number, reservation: Partial<InsertReservation>) {
  return withRetry(async () => {
    const snakeCaseReservation = convertReservationToSnakeCase(reservation);
    return await supabase
      .from("reservations")
      .update(snakeCaseReservation)
      .eq("id", id)
      .select()
      .single();
  });
}

export async function deleteReservation(id: number) {
  return withRetry(async () => {
    return await supabase
      .from("reservations")
      .delete()
      .eq("id", id);
  });
}

// Availability
// =========================================================

export async function getAvailabilityByDate(date: string) {
  return withRetry(async () => {
    return await supabase
      .from("availability")
      .select("*")
      .eq("date", date)
      .order("time_slot", { ascending: true });
  });
}

export async function getAvailabilityByDateAndTimeSlot(date: string, timeSlot: string) {
  return withRetry(async () => {
    return await supabase
      .from("availability")
      .select("*")
      .eq("date", date)
      .eq("time_slot", timeSlot)
      .single();
  });
}

export async function createAvailability(data: InsertAvailability) {
  return withRetry(async () => {
    const snakeCaseAvailability = convertAvailabilityToSnakeCase(data);
    return await supabase
      .from("availability")
      .insert(snakeCaseAvailability)
      .select()
      .single();
  });
}

export async function updateAvailability(id: number, data: Partial<InsertAvailability>) {
  return withRetry(async () => {
    const snakeCaseAvailability = convertAvailabilityToSnakeCase(data);
    return await supabase
      .from("availability")
      .update(snakeCaseAvailability)
      .eq("id", id)
      .select()
      .single();
  });
}

export async function deleteAvailability(id: number) {
  return withRetry(async () => {
    return await supabase
      .from("availability")
      .delete()
      .eq("id", id);
  });
}

export async function getAllAvailability() {
  return withRetry(async () => {
    return await supabase
      .from("availability")
      .select("*")
      .order("date", { ascending: true });
  });
}

export async function getAvailabilityByDateRange(startDate: string, endDate: string) {
  return withRetry(async () => {
    return await supabase
      .from("availability")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });
  });
}

export async function incrementReservedCount(date: string, timeSlot: string, count: number) {
  return withRetry(async () => {
    // First get the current availability
    const { data: availData, error: availError } = await supabase
      .from("availability")
      .select("*")
      .eq("date", date)
      .eq("time_slot", timeSlot)
      .single();

    if (availError) {
      return { data: null, error: availError };
    }

    if (!availData) {
      return { 
        data: null, 
        error: { message: "Availability not found" } as PostgrestError 
      };
    }

    // Then update it with the new count
    const newReserved = availData.reserved + count;
    
    return await supabase
      .from("availability")
      .update({ reserved: newReserved })
      .eq("id", availData.id)
      .select()
      .single();
  });
}

export async function decrementReservedCount(date: string, timeSlot: string, count: number) {
  return withRetry(async () => {
    // First get the current availability
    const { data: availData, error: availError } = await supabase
      .from("availability")
      .select("*")
      .eq("date", date)
      .eq("time_slot", timeSlot)
      .single();

    if (availError) {
      return { data: null, error: availError };
    }

    if (!availData) {
      return { 
        data: null, 
        error: { message: "Availability not found" } as PostgrestError 
      };
    }

    // Then update it with the new count
    const newReserved = Math.max(0, availData.reserved - count);
    
    return await supabase
      .from("availability")
      .update({ reserved: newReserved })
      .eq("id", availData.id)
      .select()
      .single();
  });
}

// Files
// =========================================================

export async function saveFile(fileData: InsertFile) {
  return withRetry(async () => {
    const snakeCaseFile = convertFileToSnakeCase(fileData);
    // Assuming files table exists but is not in the Database type
    return await (supabase as any)
      .from("files")
      .insert(snakeCaseFile)
      .select()
      .single();
  });
}

export async function getFilesByRelatedId(relatedId: number, relatedType: string) {
  return withRetry(async () => {
    return await (supabase as any)
      .from("files")
      .select("*")
      .eq("related_id", relatedId)
      .eq("related_type", relatedType);
  });
}

export async function getFileById(id: number) {
  return withRetry(async () => {
    return await (supabase as any)
      .from("files")
      .select("*")
      .eq("id", id)
      .single();
  });
}

export async function deleteFile(id: number) {
  return withRetry(async () => {
    return await (supabase as any)
      .from("files")
      .delete()
      .eq("id", id);
  });
}

// Reset function - for testing and initialization
// =========================================================

export async function reset() {
  console.log("Resetting availability data...");

  return withRetry(async () => {
    const deleteResult = await supabase
      .from("reservations")
      .delete()
      .neq("id", 0);

    console.log("Deleted existing reservations:", deleteResult);

    const deleteAvailabilityResult = await supabase
      .from("availability")
      .delete()
      .neq("id", 0);

    console.log("Deleted existing availability:", deleteAvailabilityResult);

    // Generate 365 days of availability.
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    // Create availability for 365 days.
    const timeSlots = ["10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"];
    
    const availabilityData: InsertAvailability[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip Sundays (0 is Sunday, 1 is Monday, etc.)
      if (d.getDay() === 0) continue;

      const dateStr = d.toISOString().slice(0, 10);

      for (const timeSlot of timeSlots) {
        // Create a valid InsertAvailability object with all required properties
        const availabilityItem: InsertAvailability = {
          date: dateStr,
          timeSlot,
          capacity: 3,
          reserved: 0,
          available: true,
        };
        
        availabilityData.push(availabilityItem);
      }
    }

    console.log(`Created ${availabilityData.length} availability records`);

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < availabilityData.length; i += batchSize) {
      const batch = availabilityData
        .slice(i, i + batchSize)
        .map(item => convertAvailabilityToSnakeCase(item));

      const result = await supabase
        .from("availability")
        .insert(batch);

      if (result.error) {
        console.error(`Error inserting batch ${i}-${i + batchSize}:`, result.error);
        return { data: null, error: result.error };
      }

      console.log(`Inserted batch ${i}-${i + batchSize}`);
    }

    return { data: { success: true }, error: null };
  });
} 