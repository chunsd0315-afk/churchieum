import { Bell, Calendar, Heart, ChevronRight, Book } from 'lucide-react';

const ANNOUNCEMENTS = [
  { id: '1', title: '2026년 하반기 교회 일정 안내', date: '2026.06.01' },
  { id: '2', title: '새벽기도회 시간 변경 안내', date: '2026.05.31' },
  { id: '3', title: '청년부 수련회 모집 안내', date: '2026.05.30' },
  { id: '4', title: '주차 안내 말씀', date: '2026.05.29' },
];

const TODAY_EVENTS = [
  { id: '1', title: '주일예배', time: '09:00 · 11:30', type: 'worship' },
  { id: '2', title: '청년부 모임', time: '14:00', type: 'group' },
  { id: '3', title: '헌신예배', time: '16:30', type: 'worship' },
];

const PRAYERS = [
  { id: '1', category: '교회', title: '교회와 성도들의 영적 성장을 위해', icon: Heart },
  { id: '2', category: '선교', title: '새신자 건축을 위해', icon: Heart },
  { id: '3', category: '청년', title: '다음세대를 위한 사역을 위해', icon: Heart },
];

const TODAY_VERSE = {
  text: '"여호와는 나의 목자시니 내게 부족함이 없으리로다"',
  ref: '시편 23:1',
};

export default function PCRightPanel() {
  return (
    <aside className="w-[280px] h-full flex flex-col shrink-0 overflow-y-auto scrollbar-hide"
      style={{ background: '#F8FAFC', borderLeft: '1px solid #E5E7EB' }}>

      <div className="p-4 space-y-4">

        {/* 교회 소식 */}
        <section className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-500" />
              <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>교회 소식</h3>
            </div>
            <button className="flex items-center gap-0.5 text-primary-500 hover:text-primary-600 transition-colors"
              style={{ fontSize: '12px', fontWeight: 500 }}>
              더보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {ANNOUNCEMENTS.map(a => (
              <div key={a.id} className="flex items-start gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded-[10px] px-2 -mx-2 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-1.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-gray-700 truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{a.title}</p>
                  <p className="text-gray-400" style={{ fontSize: '11px' }}>{a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 오늘의 말씀 */}
        <section className="rounded-[20px] p-4 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #16A34A 100%)' }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Book className="w-4 h-4 text-white/80" />
              <h3 className="font-bold text-white/90" style={{ fontSize: '12px' }}>오늘의 말씀</h3>
            </div>
            <p className="leading-relaxed text-white" style={{ fontSize: '13px', fontWeight: 500 }}>{TODAY_VERSE.text}</p>
            <p className="mt-2 text-white/70" style={{ fontSize: '12px' }}>{TODAY_VERSE.ref}</p>
          </div>
        </section>

        {/* 오늘 일정 */}
        <section className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-secondary-500" />
            <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>오늘 일정</h3>
          </div>
          <div className="space-y-2">
            {TODAY_EVENTS.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-[12px]" style={{ background: '#F0FDF4' }}>
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: '#22C55E' }}>
                  <Calendar className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate" style={{ fontSize: '13px' }}>{e.title}</p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 기도 제목 */}
        <section className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-gray-900" style={{ fontSize: '14px' }}>기도 제목</h3>
            </div>
            <button className="flex items-center gap-0.5 text-primary-500" style={{ fontSize: '12px', fontWeight: 500 }}>
              더보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {PRAYERS.map(p => (
              <div key={p.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-gray-50 rounded-[10px] px-2 -mx-2 transition-colors">
                <span className="shrink-0 px-2 py-0.5 rounded-full text-rose-600 font-bold"
                  style={{ fontSize: '10px', background: '#FFF1F2' }}>{p.category}</span>
                <p className="text-gray-700 truncate flex-1" style={{ fontSize: '12px', fontWeight: 500 }}>{p.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-2">
          <p style={{ fontSize: '11px', color: '#D1D5DB' }}>교회이음 ChurchIeum v1.0</p>
        </div>

      </div>
    </aside>
  );
}
