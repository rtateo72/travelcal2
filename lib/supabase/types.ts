export type AvailabilityStatus = "free" | "tentative" | "busy";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      trips: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          emoji: string;
          invite_code: string;
          owner_id: string;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          emoji?: string;
          owner_id: string;
          is_public?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          emoji?: string;
          is_public?: boolean;
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
        };
        Update: Record<string, never>;
      };
      availability: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          date: string;
          status: AvailabilityStatus;
          updated_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          date: string;
          status: AvailabilityStatus;
        };
        Update: {
          status?: AvailabilityStatus;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripMember = Database["public"]["Tables"]["trip_members"]["Row"];
export type Availability = Database["public"]["Tables"]["availability"]["Row"];

export interface TripWithOwner extends Trip {
  profiles: Profile;
}

export interface AvailabilityWithProfile extends Availability {
  profiles: Profile;
}