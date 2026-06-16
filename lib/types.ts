export type Role = "seeker" | "employer";

export interface SeekerProfile {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  skills: string[];
  availability: AvailabilitySlot[];
  location_text: string;
  lat: number | null;
  lng: number | null;
  profile_score: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  name: string;
  company_name: string;
  photo_url: string | null;
  location_text: string;
  lat: number | null;
  lng: number | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface AvailabilitySlot {
  day: number; // 0=Sun … 6=Sat
  from: string; // "09:00"
  to: string;   // "17:00"
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location_text: string;
  lat: number | null;
  lng: number | null;
  pay_amount: number;
  pay_type: "hourly" | "daily" | "monthly" | "fixed";
  schedule: AvailabilitySlot[];
  skills_needed: string[];
  urgent: boolean;
  active: boolean;
  created_at: string;
  employer?: EmployerProfile;
}

export interface Match {
  id: string;
  seeker_id: string;
  employer_id: string;
  job_id: string;
  status: "pending" | "matched" | "accepted" | "completed" | "cancelled";
  seeker_rated: boolean;
  employer_rated: boolean;
  created_at: string;
  job?: Job;
  seeker?: SeekerProfile;
  employer?: EmployerProfile;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  type: "text" | "system";
  created_at: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  target_id: string;
  target_type: "job" | "seeker";
  direction: "left" | "right" | "save";
  created_at: string;
}

export interface JobCardData extends Job {
  distance_km: number;
  match_score: number;
}

export interface CandidateCardData extends SeekerProfile {
  distance_km: number;
  match_score: number;
}
