import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useFileUpload } from '../../hooks/useFileUpload';
import {
  Building2, MapPin, Clock, Globe, Youtube, Save, User, Phone,
  FileText, Plus, Trash2, CheckCircle, AlertCircle,
  ChevronRight, Award, Upload, Loader2, Image as ImageIcon, X,
} from 'lucide-react';

type ChurchData = {
  id: string;
  name: string;
  denomination: string;
  description: string;
  pastor_name: string;
  address: string;
  website_url: string;
  youtube_url: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  verification_status: string;
  worship_times: WorshipEntry[];
  photo_url?: string;
};

type WorshipEntry = { type: string; time: string; day: string };

const DENOMINATIONS = [
  '예장통합', '예장합동', '기감', '기독교대한성결교', '침례교', '기장', '순복음', '기타',
];
const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const WORSHIP_PRESETS = ['주일 1부 예배', '주일 2부 예배', '주일 3부 예배', '수요 예배', '금요 기도회', '새벽 기도회', '특별 집회'];

const EMPTY_CHURCH: ChurchData = {
  id: '',
  name: '',
  denomination: '예장통합',
  description: '',
  pastor_name: '',
  address: '',
  website_url: '',
  youtube_url: '',
  latitude: null,
  longitude: null,
  is_verified: false,
  verification_status: 'pending',
  photo_url: '',
  worship_times: [
    { type: '주일 1부 예배', time: '09:00', day: '일요일' },
    { type: '주일 2부 예배', time: '11:00', day: '일요일' },
    { type: '수요 예배',     time: '19:30', day: '수요일' },
  ],
};

type Section = 'basic' | 'contact' | 'worship' | 'media';

const SECTIONS: { key: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'basic',   label: '기본 정보',    icon: Building2 },
  { key: 'contact', label: '담임목사 & 연락처', icon: User },
  { key: 'worship', label: '예배 시간',    icon: Clock },
  { key: 'media',   label: '온라인 채널',  icon: Globe },
];

export default function ChurchManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [data, setData] = useState<ChurchData>(EMPTY_CHURCH);
  const [isNew, setIsNew] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoUpload = useFileUpload({ bucket: 'church-photos', maxSizeMB: 10 });

  useEffect(() => {
    (async () => {
      const { data: church } = await supabase.from('churches').select('*').limit(1).maybeSingle();
      if (church) {
        setData({
          ...EMPTY_CHURCH,
          ...church,
          worship_times: Array.isArray(church.worship_times) ? church.worship_times : EMPTY_CHURCH.worship_times,
        });
        setIsNew(false);
      }
      setLoading(false);
    })();
  }, []);

  const f = <K extends keyof ChurchData>(k: K, v: ChurchData[K]) => setData(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!data.name.trim()) { setError('교회명을 입력해주세요'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = {
        name: data.name,
        denomination: data.denomination,
        description: data.description || null,
        pastor_name: data.pastor_name || null,
        address: data.address || null,
        website_url: data.website_url || null,
        youtube_url: data.youtube_url || null,
        latitude: data.latitude,
        longitude: data.longitude,
        worship_times: data.worship_times,
        photo_url: data.photo_url || null,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { data: created } = await supabase.from('churches').insert(payload).select().single();
        if (created) { setData(prev => ({ ...prev, id: created.id })); setIsNew(false); }
      } else {
        await supabase.from('churches').update(payload).eq('id', data.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('저장 중 오류가 발생했습니다');
    }
    setSaving(false);
  };

  const updateWorship = (i: number, field: keyof WorshipEntry, val: string) => {
    const updated = data.worship_times.map((w, idx) => idx === i ? { ...w, [field]: val } : w);
    f('worship_times', updated);
  };
  const addWorship = () => f('worship_times', [...data.worship_times, { type: '주일 예배', time: '10:00', day: '일요일' }]);
  const removeWorship = (i: number) => f('worship_times', data.worship_times.filter((_, idx) => idx !== i));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{data.name || '교회 정보'}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {data.is_verified
              ? <span className="flex items-center gap-1 text-secondary-600"><Award className="w-3.5 h-3.5" /> 인증된 교회</span>
              : <span className="text-amber-500">미인증</span>}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-sm text-sm">
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 저장 중...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> 저장됨</>
          ) : (
            <><Save className="w-4 h-4" /> 저장</>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Section nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeSection === s.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 shadow-sm'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{s.label}</span>
              {activeSection === s.key && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-60" />}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* ── 기본 정보 ── */}
        {activeSection === 'basic' && (
          <>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-primary-500" /> 교회 기본 정보
            </h3>

            {/* Church photo upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" /> 교회 대표 사진 (선택)
              </label>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await photoUpload.upload(file);
                  if (url) f('photo_url', url);
                  e.target.value = '';
                }} />
              {data.photo_url ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-h-48">
                  <img src={data.photo_url} alt="교회 사진" className="w-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button type="button" onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-700 rounded-xl text-xs font-semibold hover:bg-white shadow-sm">
                      <Upload className="w-3.5 h-3.5" /> 변경
                    </button>
                    <button type="button" onClick={() => f('photo_url', '')}
                      className="p-1.5 bg-white/90 text-gray-600 rounded-xl hover:bg-white shadow-sm">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  disabled={photoUpload.uploading}
                  className="w-full flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors disabled:opacity-50">
                  {photoUpload.uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...</>
                    : <><Upload className="w-4 h-4" /> 교회 사진 선택 (JPG, PNG · 최대 10MB)</>}
                </button>
              )}
              {photoUpload.error && <p className="text-xs text-red-500 mt-1">{photoUpload.error}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">교회명 *</label>
                <input type="text" value={data.name} onChange={e => f('name', e.target.value)}
                  placeholder="예: 순복음성북교회"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">교단</label>
                <select value={data.denomination} onChange={e => f('denomination', e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                  {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">교회 소개</label>
              <textarea value={data.description} onChange={e => f('description', e.target.value)}
                rows={4} placeholder="교회 소개말을 입력하세요"
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" /> 주소
              </label>
              <input type="text" value={data.address} onChange={e => f('address', e.target.value)}
                placeholder="서울시 성북구 동소문동"
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">위도</label>
                <input type="number" step="any" value={data.latitude ?? ''} onChange={e => f('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="37.123456"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">경도</label>
                <input type="number" step="any" value={data.longitude ?? ''} onChange={e => f('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="127.123456"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
            </div>
          </>
        )}

        {/* ── 담임목사 & 연락처 ── */}
        {activeSection === 'contact' && (
          <>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-secondary-500" /> 담임목사 정보
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">담임목사 성함</label>
              <input type="text" value={data.pastor_name} onChange={e => f('pastor_name', e.target.value)}
                placeholder="홍길동 목사"
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> 교회 연락처
              </p>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                교회 전화번호와 이메일은 교회 프로필 화면에서 직접 표시됩니다. 현재 DB 스키마에는 저장 필드가 추가될 예정입니다.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" /> 인증 현황
              </p>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${data.is_verified ? 'bg-secondary-50' : 'bg-amber-50'}`}>
                {data.is_verified
                  ? <><CheckCircle className="w-5 h-5 text-secondary-600 flex-shrink-0" /><div><p className="text-sm font-bold text-secondary-700">인증 완료</p><p className="text-xs text-secondary-500">이 교회는 교회이음 인증을 받았습니다</p></div></>
                  : <><AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" /><div><p className="text-sm font-bold text-amber-700">미인증</p><p className="text-xs text-amber-500">교회인증센터에서 인증 신청을 진행하세요</p></div></>
                }
              </div>
            </div>
          </>
        )}

        {/* ── 예배 시간 ── */}
        {activeSection === 'worship' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary-500" /> 예배 시간 설정
              </h3>
              <button onClick={addWorship}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold hover:bg-primary-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> 예배 추가
              </button>
            </div>

            {data.worship_times.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Clock className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">예배 시간을 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.worship_times.map((w, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">예배 {i + 1}</span>
                      <button onClick={() => removeWorship(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">요일</label>
                        <select value={w.day} onChange={e => updateWorship(i, 'day', e.target.value)}
                          className="w-full px-2.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">예배명</label>
                        <input type="text" value={w.type} onChange={e => updateWorship(i, 'type', e.target.value)}
                          list="worship-presets"
                          className="w-full px-2.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                        <datalist id="worship-presets">
                          {WORSHIP_PRESETS.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">시간</label>
                        <input type="time" value={w.time} onChange={e => updateWorship(i, 'time', e.target.value)}
                          className="w-full px-2.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 온라인 채널 ── */}
        {activeSection === 'media' && (
          <>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-blue-500" /> 온라인 채널
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Globe className="w-3.5 h-3.5 inline mr-1 text-gray-400" /> 홈페이지 URL
              </label>
              <input type="url" value={data.website_url} onChange={e => f('website_url', e.target.value)}
                placeholder="https://church.example.com"
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Youtube className="w-3.5 h-3.5 inline mr-1 text-red-400" /> 유튜브 채널 URL
              </label>
              <input type="url" value={data.youtube_url} onChange={e => f('youtube_url', e.target.value)}
                placeholder="https://youtube.com/@church"
                className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
            {(data.website_url || data.youtube_url) && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-3">미리보기</p>
                <div className="flex flex-wrap gap-2">
                  {data.website_url && (
                    <a href={data.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                      <Globe className="w-4 h-4" /> 홈페이지 방문
                    </a>
                  )}
                  {data.youtube_url && (
                    <a href={data.youtube_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                      <Youtube className="w-4 h-4" /> 유튜브 채널
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom save bar */}
      <div className="flex justify-end pb-8">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-sm">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '저장 중...' : '교회 정보 저장'}
        </button>
      </div>
    </div>
  );
}
