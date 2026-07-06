import { useState, useCallback } from 'react';
import {
  MapPin, Search, Shield, Star, Users, Clock, ChevronRight,
  Navigation, Filter, X, Map, List, Globe, Youtube,
  Phone, ExternalLink, Locate,
} from 'lucide-react';

type Church = {
  id: string;
  name: string;
  denomination: string;
  address: string;
  district: string;
  distance: number;
  verified: boolean;
  rating: number;
  pastor: string;
  worship_times: { type: string; time: string }[];
  member_count: number;
  phone?: string;
  website?: string;
  youtube?: string;
  description?: string;
  // demo map position (percentages within the map container)
  mapX: number;
  mapY: number;
};

const DEMO_CHURCHES: Church[] = [
  {
    id: '1', name: '평안교회', denomination: '예장통합', district: '강남구',
    address: '서울시 강남구 테헤란로 123', distance: 0.8, verified: true,
    rating: 4.8, pastor: '김성기 목사',
    worship_times: [{ type: '주일 1부', time: '09:00' }, { type: '주일 2부', time: '11:00' }, { type: '수요', time: '19:30' }],
    member_count: 500, phone: '02-1234-5678',
    website: 'https://peace-church.example.com', youtube: 'https://youtube.com/@peacechurch',
    description: '1980년 설립된 지역 대표 교회입니다. 말씀과 기도, 선교에 중점을 둔 건강한 교회공동체입니다.',
    mapX: 55, mapY: 45,
  },
  {
    id: '2', name: '소망교회', denomination: '예장합동', district: '서초구',
    address: '서울시 서초구 서초대로 456', distance: 1.2, verified: true,
    rating: 4.5, pastor: '이재훈 목사',
    worship_times: [{ type: '주일 1부', time: '10:30' }, { type: '주일 2부', time: '14:00' }],
    member_count: 300, phone: '02-2345-6789',
    website: 'https://hope-church.example.com', youtube: 'https://youtube.com/@hopechurch',
    description: '다음 세대를 중점으로 섬기는 교회입니다.',
    mapX: 42, mapY: 60,
  },
  {
    id: '3', name: '사랑교회', denomination: '기감', district: '송파구',
    address: '서울시 송파구 올림픽로 789', distance: 2.1, verified: true,
    rating: 4.6, pastor: '박도한 목사',
    worship_times: [{ type: '주일 오전', time: '11:00' }],
    member_count: 450, phone: '02-3456-7890',
    website: 'https://love-church.example.com',
    description: '이웃을 사랑으로 섬기는 감리교 교회입니다.',
    mapX: 72, mapY: 38,
  },
  {
    id: '4', name: '은혜교회', denomination: '기독교대한감리회', district: '강동구',
    address: '서울시 강동구 천호대로 321', distance: 3.5, verified: false,
    rating: 4.2, pastor: '최선호 목사',
    worship_times: [{ type: '주일 오전', time: '10:00' }],
    member_count: 200, phone: '02-4567-8901',
    mapX: 82, mapY: 30,
  },
  {
    id: '5', name: '믿음교회', denomination: '예장통합', district: '마포구',
    address: '서울시 마포구 양화로 555', distance: 4.2, verified: true,
    rating: 4.7, pastor: '정민우 목사',
    worship_times: [{ type: '주일 1부', time: '09:30' }, { type: '주일 2부', time: '11:30' }, { type: '수요', time: '19:00' }],
    member_count: 600, phone: '02-5678-9012',
    website: 'https://faith-church.example.com', youtube: 'https://youtube.com/@faithchurch',
    description: '1970년 개척하여 50년 이상 지역사회를 섬겨온 역사 깊은 교회입니다.',
    mapX: 25, mapY: 52,
  },
  {
    id: '6', name: '새생명교회', denomination: '침례교', district: '용산구',
    address: '서울시 용산구 한강대로 200', distance: 1.9, verified: true,
    rating: 4.4, pastor: '한기범 목사',
    worship_times: [{ type: '주일 오전', time: '11:00' }, { type: '수요', time: '19:30' }],
    member_count: 280, phone: '02-6789-0123',
    description: '청년 사역에 특화된 활동적인 침례교 교회입니다.',
    mapX: 38, mapY: 35,
  },
  {
    id: '7', name: '성광교회', denomination: '기독교대한성결교', district: '동대문구',
    address: '서울시 동대문구 왕산로 88', distance: 2.8, verified: false,
    rating: 4.0, pastor: '손영민 목사',
    worship_times: [{ type: '주일 오전', time: '10:30' }],
    member_count: 150,
    mapX: 62, mapY: 25,
  },
  {
    id: '8', name: '순복음성북교회', denomination: '기독교대한하나님의성회', district: '성북구',
    address: '서울시 성북구 보문로 100', distance: 0.3, verified: true,
    rating: 4.9, pastor: '김선도 목사',
    worship_times: [{ type: '주일 1부', time: '09:00' }, { type: '주일 2부', time: '11:00' }, { type: '주일 3부', time: '14:00' }, { type: '수요', time: '19:30' }, { type: '금요철야', time: '21:00' }],
    member_count: 1200, phone: '02-7890-1234',
    website: 'https://sfbc.example.com', youtube: 'https://youtube.com/@sfbc',
    description: '1965년 설립, 지역사회와 선교에 헌신하는 교회입니다. 매주 특별 집회와 다양한 부서 프로그램을 운영합니다.',
    mapX: 48, mapY: 20,
  },
];

const DENOMINATIONS = [
  { id: 'all', label: '전체' },
  { id: '예장통합', label: '예장통합' },
  { id: '예장합동', label: '예장합동' },
  { id: '기감', label: '기감' },
  { id: '기독교대한감리회', label: '감리회' },
  { id: '기독교대한성결교', label: '성결교' },
  { id: '침례교', label: '침례교' },
  { id: '기독교대한하나님의성회', label: '하나님의성회' },
];

type ViewMode = 'list' | 'map';

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      <span className="font-semibold text-gray-700">{rating}</span>
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary-100 text-primary-600 text-[10px] font-bold rounded-full">
      <Shield className="w-2.5 h-2.5" /> 인증
    </span>
  );
}

/* ── Demo Map View ── */
function MapView({ churches, onSelect }: { churches: Church[]; onSelect: (c: Church) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '380px' }}>
      {/* Map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        {/* Road lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Major roads */}
          <path d="M0 50 Q25 48 50 50 Q75 52 100 50" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
          <path d="M50 0 Q48 25 50 50 Q52 75 50 100" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
          <path d="M0 25 Q50 23 100 25" stroke="#e5e7eb" strokeWidth="1" fill="none" />
          <path d="M0 75 Q50 73 100 75" stroke="#e5e7eb" strokeWidth="1" fill="none" />
          <path d="M25 0 Q23 50 25 100" stroke="#e5e7eb" strokeWidth="1" fill="none" />
          <path d="M75 0 Q73 50 75 100" stroke="#e5e7eb" strokeWidth="1" fill="none" />
          {/* Highway */}
          <path d="M0 62 Q50 60 100 62" stroke="#bfdbfe" strokeWidth="2.5" fill="none" />
          <path d="M0 38 Q50 36 100 38" stroke="#bfdbfe" strokeWidth="1.5" fill="none" />
          {/* River */}
          <path d="M0 68 Q30 66 50 70 Q70 74 100 70" stroke="#93c5fd" strokeWidth="3" fill="none" strokeOpacity="0.5" />
        </svg>
        {/* Block labels */}
        <div className="absolute" style={{ left: '10%', top: '10%' }}>
          <span className="text-[9px] text-slate-400 font-medium">마포구</span>
        </div>
        <div className="absolute" style={{ left: '55%', top: '8%' }}>
          <span className="text-[9px] text-slate-400 font-medium">성북구</span>
        </div>
        <div className="absolute" style={{ left: '35%', top: '30%' }}>
          <span className="text-[9px] text-slate-400 font-medium">용산구</span>
        </div>
        <div className="absolute" style={{ left: '52%', top: '50%' }}>
          <span className="text-[9px] text-slate-400 font-medium">강남구</span>
        </div>
        <div className="absolute" style={{ left: '30%', top: '55%' }}>
          <span className="text-[9px] text-slate-400 font-medium">서초구</span>
        </div>
        <div className="absolute" style={{ left: '72%', top: '42%' }}>
          <span className="text-[9px] text-slate-400 font-medium">송파구</span>
        </div>
      </div>

      {/* My location pulse */}
      <div
        className="absolute z-10"
        style={{ left: '47%', top: '22%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg z-10 relative" />
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        </div>
      </div>

      {/* Church pins */}
      {churches.map(church => (
        <button
          key={church.id}
          onClick={() => onSelect(church)}
          onMouseEnter={() => setHoveredId(church.id)}
          onMouseLeave={() => setHoveredId(null)}
          className="absolute z-20 transition-transform hover:scale-110 active:scale-95"
          style={{ left: `${church.mapX}%`, top: `${church.mapY}%`, transform: 'translate(-50%, -100%)' }}
        >
          <div className={`relative ${hoveredId === church.id ? 'scale-110' : ''} transition-all`}>
            {/* Pin */}
            <div className={`px-2.5 py-1.5 rounded-xl shadow-lg border-2 text-white text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
              church.verified ? 'bg-primary-500 border-primary-400' : 'bg-gray-500 border-gray-400'
            }`}>
              {church.verified && <Shield className="w-2.5 h-2.5" />}
              {church.name}
            </div>
            {/* Pin tail */}
            <div className={`w-2 h-2 rotate-45 mx-auto -mt-1 ${church.verified ? 'bg-primary-500' : 'bg-gray-500'}`} />
            {/* Hover card */}
            {hoveredId === church.id && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-40 pointer-events-none z-30">
                <p className="font-bold text-gray-900 text-xs mb-0.5">{church.name}</p>
                <p className="text-[10px] text-gray-500">{church.denomination}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                  <StarRating rating={church.rating} />
                  <span>{church.distance}km</span>
                </div>
              </div>
            )}
          </div>
        </button>
      ))}

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        <button className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-lg font-bold text-gray-600">+</button>
        <button className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-lg font-bold text-gray-600">−</button>
      </div>
      <div className="absolute bottom-3 left-3 bg-white rounded-xl shadow-md border border-gray-200 px-3 py-2 flex items-center gap-1.5 z-20">
        <div className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
        <span className="text-[10px] text-gray-600 font-medium">내 위치</span>
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 bg-white/80 px-2 py-1 rounded-lg z-20">
        데모 지도
      </div>
    </div>
  );
}

/* ── Church Detail Sheet ── */
function ChurchDetail({ church, onClose }: { church: Church; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900">{church.name}</h3>
            {church.verified && <VerifiedBadge />}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Summary row */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{church.denomination}</span>
            <StarRating rating={church.rating} />
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Navigation className="w-3 h-3" /> {church.distance}km
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" /> {church.member_count.toLocaleString()}명
            </span>
          </div>

          {/* Description */}
          {church.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{church.description}</p>
          )}

          {/* Pastor */}
          <div className="flex items-center gap-3 bg-primary-50 rounded-xl p-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">담임목사</p>
              <p className="font-semibold text-gray-900">{church.pastor}</p>
            </div>
          </div>

          {/* Worship Times */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-secondary-500" /> 예배시간
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {church.worship_times.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary-50 rounded-xl px-3 py-2.5">
                  <span className="text-xs font-medium text-gray-600">{w.type}</span>
                  <span className="text-sm font-bold text-secondary-700">{w.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address + Map Mini */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" /> 오시는 길
            </h4>
            <p className="text-sm text-gray-600 mb-3">{church.address}</p>
            {/* Mini map placeholder */}
            <div className="h-28 bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-primary-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">지도 보기</p>
              </div>
            </div>
            <button className="w-full mt-2 py-2.5 bg-primary-50 text-primary-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-100 transition-colors">
              <Navigation className="w-4 h-4" /> 길 찾기
            </button>
          </div>

          {/* Contact & Links */}
          <div className="space-y-2">
            {church.phone && (
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{church.phone}</span>
                </div>
                <button className="text-xs text-primary-600 font-medium">전화</button>
              </div>
            )}
            {church.website && (
              <a href={church.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-700">홈페이지</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </a>
            )}
            {church.youtube && (
              <a href={church.youtube} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">유튜브 설교</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              </a>
            )}
          </div>

          <button className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 transition-colors shadow-sm">
            이 교회 등록하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChurchFinderPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState('all');
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const filtered = DEMO_CHURCHES.filter(c => {
    if (showOnlyVerified && !c.verified) return false;
    if (selectedDenomination !== 'all' && c.denomination !== selectedDenomination) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.denomination.toLowerCase().includes(q);
    }
    return true;
  });

  const handleLocate = useCallback(() => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { setLocationGranted(true); setLocating(false); },
        () => { setLocating(false); }
      );
    } else {
      setTimeout(() => { setLocationGranted(true); setLocating(false); }, 1000);
    }
  }, []);

  const verifiedCount = DEMO_CHURCHES.filter(c => c.verified).length;

  return (
    <div className="pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">교회찾기</h2>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary-500" /> 인증교회 {verifiedCount}개 포함 · 전체 {DEMO_CHURCHES.length}개
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocate}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              locationGranted
                ? 'bg-secondary-500 text-white'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
          >
            {locating ? (
              <span className="w-3 h-3 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <Locate className="w-3.5 h-3.5" />
            )}
            {locationGranted ? '위치 확인됨' : '현재 위치'}
          </button>
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="교회명, 지역, 교단 검색..."
          className="w-full pl-11 pr-12 py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary-400 focus:ring-0 text-sm shadow-sm"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
            showFilters || showOnlyVerified || selectedDenomination !== 'all'
              ? 'bg-primary-100 text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Denomination quick filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {DENOMINATIONS.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDenomination(d.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              selectedDenomination === d.id ? 'bg-primary-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">인증교회만 보기</p>
              <p className="text-xs text-gray-400">교회이음 인증을 받은 교회만 표시</p>
            </div>
            <button
              onClick={() => setShowOnlyVerified(!showOnlyVerified)}
              className={`w-12 h-6 rounded-full transition-colors relative ${showOnlyVerified ? 'bg-primary-500' : 'bg-gray-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${showOnlyVerified ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-gray-400">
        검색 결과 <span className="text-primary-600 font-semibold">{filtered.length}개</span>의 교회
      </p>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="space-y-3">
          <MapView churches={filtered} onSelect={setSelectedChurch} />
          {/* Below map: compact list */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">목록</p>
          <div className="space-y-2">
            {filtered.map(church => (
              <button
                key={church.id}
                onClick={() => setSelectedChurch(church)}
                className="w-full text-left bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${church.verified ? 'bg-primary-50' : 'bg-gray-50'}`}>
                  <MapPin className={`w-4 h-4 ${church.verified ? 'text-primary-500' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{church.name}</p>
                    {church.verified && <VerifiedBadge />}
                  </div>
                  <p className="text-xs text-gray-400">{church.denomination} · {church.distance}km</p>
                </div>
                <StarRating rating={church.rating} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map(church => (
            <button
              key={church.id}
              onClick={() => setSelectedChurch(church)}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.99] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  church.verified ? 'bg-gradient-to-br from-primary-100 to-secondary-100' : 'bg-gray-100'
                }`}>
                  <span className="text-2xl">⛪</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900">{church.name}</h3>
                    {church.verified && <VerifiedBadge />}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{church.denomination} · {church.pastor}</p>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {church.address}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Navigation className="w-3 h-3" /> {church.distance}km
                    </span>
                    <StarRating rating={church.rating} />
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" /> {church.member_count.toLocaleString()}명
                    </span>
                    {church.worship_times[0] && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" /> 주일 {church.worship_times[0].time}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </button>
          )) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">검색 결과가 없습니다</p>
              <button onClick={() => { setSearchTerm(''); setSelectedDenomination('all'); setShowOnlyVerified(false); }}
                className="mt-3 text-primary-500 text-sm font-medium">
                필터 초기화
              </button>
            </div>
          )}
        </div>
      )}

      {/* Church Detail */}
      {selectedChurch && (
        <ChurchDetail church={selectedChurch} onClose={() => setSelectedChurch(null)} />
      )}
    </div>
  );
}
