import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { getAllAnnouncements } from '../../../services/announcementStorage';
import { getAllPrayers } from '../../../services/prayerStorage';
import { getIntercessionPrayers } from '../../../services/prayerHelpers';
import { useAuth } from '../../../contexts/AuthContext';
import type { NoticeItem, ScheduleItem, PrayerItem } from './HomeDashboard';

export type HomeDashboardData = {
  recentNotices: NoticeItem[];
  upcomingSchedules: ScheduleItem[];
  prayerItems: PrayerItem[];
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export function useHomeDashboardData(): HomeDashboardData {
  const { user } = useAuth();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);

  useEffect(() => {
    // Announcements — localStorage
    const raw = getAllAnnouncements()
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        date: formatDate(a.created_at),
        isPinned: false,
      }));
    setNotices(raw);

    // Events — Supabase
    const today = new Date().toISOString().slice(0, 10);
    void Promise.resolve(
      supabase
        .from('events')
        .select('id, title, event_date, event_time, location')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5)
        .then(({ data }) => {
          if (!data) return;
          setSchedules(
            data.map((r: { id: string; title: string; event_date: string; event_time?: string | null; location?: string | null }) => ({
              id: r.id,
              title: r.title,
              date: r.event_date,
              time: r.event_time ?? undefined,
              location: r.location ?? undefined,
            }))
          );
        })
    ).catch(() => {/* keep empty */});

    // Prayers — visibility → 권한 검사 → 홈 미리보기
    const localPrayers = getIntercessionPrayers(getAllPrayers(), user)
      .slice(0, 5)
      .map(p => ({ id: p.id, title: p.title, authorName: p.authorName, createdAt: p.createdAt }));
    if (localPrayers.length > 0) {
      setPrayers(localPrayers);
    } else {
      void Promise.resolve(
        supabase
          .from('prayers')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data }) => {
            if (!data) return;
            setPrayers(
              data.map((r: { id: string; title: string; created_at: string }) => ({
                id: r.id,
                title: r.title,
                createdAt: r.created_at,
              }))
            );
          })
      ).catch(() => {/* keep empty */});
    }
  }, [user]);

  return { recentNotices: notices, upcomingSchedules: schedules, prayerItems: prayers };
}
