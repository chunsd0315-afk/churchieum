import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when real Supabase credentials are configured (e.g. via .env). */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Allow the app to boot without .env; API calls fail gracefully and pages use demo/localStorage fallbacks.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(url, key);

export type Member = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  department_id?: string;
  district_id?: string;
  join_date?: string;
  baptism_date?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: string;
  name: string;
  description?: string;
  leader_id?: string;
  created_at: string;
};

export type District = {
  id: string;
  name: string;
  leader_id?: string;
  created_at: string;
};

export type Sermon = {
  id: string;
  title: string;
  bible_verse?: string;
  content?: string;
  audio_url?: string;
  video_url?: string;
  preacher: string;
  sermon_date: string;
  sermon_type?: string;
  created_at: string;
};

export type Qt = {
  id: string;
  title: string;
  bible_verse: string;
  content: string;
  meditation?: string;
  prayer?: string;
  qt_date: string;
  created_at: string;
};

export type QtWriting = {
  id: string;
  member_id: string;
  qt_id: string;
  content?: string;
  prayer?: string;
  application?: string;
  created_at: string;
};

export type Prayer = {
  id: string;
  member_id: string;
  title: string;
  content: string;
  is_private: boolean;
  is_answered: boolean;
  answered_date?: string;
  category?: string;
  created_at: string;
  updated_at: string;
};

export type IntercessionRequest = {
  id: string;
  prayer_id: string;
  requested_by: string;
  prayer_count: number;
  created_at: string;
};

export type ChurchPrayer = {
  id: string;
  title: string;
  content: string;
  prayer_date: string;
  is_active: boolean;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author_id?: string;
  category: string;
  is_pinned: boolean;
  is_important: boolean;
  is_popup?: boolean;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  view_count: number;
  published_at: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  member_id: string;
  worship_type: string;
  attendance_date: string;
  is_present: boolean;
  notes?: string;
  created_at: string;
};

export type Album = {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  cover_image?: string;
  created_at: string;
};

export type Photo = {
  id: string;
  album_id: string;
  url: string;
  caption?: string;
  uploaded_by?: string;
  created_at: string;
};

export type Visit = {
  id: string;
  visitor_id?: string;
  visited_member_id?: string;
  visit_date: string;
  purpose?: string;
  notes?: string;
  next_action?: string;
  created_at: string;
};

export type NewFamily = {
  id: string;
  member_id: string;
  contact_source?: string;
  first_visit_date?: string;
  decision_date?: string;
  counselor_id?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export type Church = {
  id: string;
  name: string;
  denomination?: string;
  description?: string;
  pastor_name?: string;
  worship_times?: Record<string, string>;
  address?: string;
  website_url?: string;
  youtube_url?: string;
  latitude?: number;
  longitude?: number;
  is_verified: boolean;
  verification_status: string;
  created_at: string;
  updated_at: string;
};

export type ChurchDocument = {
  id: string;
  church_id: string;
  document_type: string;
  file_url: string;
  status: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
};

export type BiblePlan = {
  id: string;
  name: string;
  description?: string;
  duration_days: number;
  plan_type: string;
  created_at: string;
};

export type BiblePlanSchedule = {
  id: string;
  plan_id: string;
  day_number: number;
  bible_book: string;
  start_chapter: number;
  end_chapter: number;
  created_at: string;
};

export type BibleReadingProgress = {
  id: string;
  member_id: string;
  plan_id: string;
  schedule_id: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
};

export type Bulletin = {
  id: string;
  title: string;
  description?: string;
  bulletin_date: string;
  pdf_url?: string;
  image_url?: string;
  image_urls?: string[];
  view_count: number;
  is_archived: boolean;
  created_at: string;
};

export type AnnouncementFull = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_important: boolean;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  view_count: number;
  published_at: string;
  created_at: string;
};

export type ChurchEvent = {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  event_type: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: string;
};

export type Verse = {
  id: string;
  member_id: string;
  bible_verse: string;
  content: string;
  is_memorized: boolean;
  created_at: string;
};

export type Permission = {
  id: string;
  user_id: string;
  member_id?: string;
  permission_type: string;
  granted_by?: string;
  created_at: string;
};
