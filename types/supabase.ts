export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          username: string
          email: string
          password: string
          is_admin: boolean
          reset_token: string | null
          reset_token_expiry: string | null
        }
        Insert: {
          id?: number
          username: string
          email: string
          password: string
          is_admin?: boolean
          reset_token?: string | null
          reset_token_expiry?: string | null
        }
        Update: {
          id?: number
          username?: string
          email?: string
          password?: string
          is_admin?: boolean
          reset_token?: string | null
          reset_token_expiry?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: number
          reservation_id: string
          date: string
          time_slot: string
          name: string
          inst_name: string
          phone: string
          email: string | null
          participants: number
          desired_activity: string
          parent_participation: string
          created_at: string
        }
        Insert: {
          id?: number
          reservation_id: string
          date: string
          time_slot: string
          name: string
          inst_name: string
          phone: string
          email?: string | null
          participants: number
          desired_activity: string
          parent_participation: string
          created_at?: string
        }
        Update: {
          id?: number
          reservation_id?: string
          date?: string
          time_slot?: string
          name?: string
          inst_name?: string
          phone?: string
          email?: string | null
          participants?: number
          desired_activity?: string
          parent_participation?: string
          created_at?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          id: number
          date: string
          time_slot: string
          capacity: number
          reserved: number
          available: boolean
        }
        Insert: {
          id?: number
          date: string
          time_slot: string
          capacity?: number
          reserved?: number
          available?: boolean
        }
        Update: {
          id?: number
          date?: string
          time_slot?: string
          capacity?: number
          reserved?: number
          available?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 