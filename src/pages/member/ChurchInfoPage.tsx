import {
  Church, MapPin, Phone, Globe, Youtube, Clock, User,
  ChevronRight, ExternalLink, Copy, Check,
} from 'lucide-react';
import { useState } from 'react';
import { FeatureHubPage, HubBackBar } from '../../components/common/feature-hub';
import { CHURCH_INFO_HUB } from '../../config/featureHub/memberHubs';
import { useAuth } from '../../contexts/AuthContext';

const CHURCH = {
  name: '순복음성북교회',
  denomination: '기독교대한하나님의성회 (순복음)',
  founded: '1982년',
  intro: '순복음성북교회는 서울 성북구에 위치한 하나님의성회 소속 교회입니다. 1982년 창립 이래 40여 년 동안 성북 지역 복음화와 세계 선교에 헌신해 왔으며, 말씀과 성령이 충만한 예배, 소그룹 중심의 양육, 그리고 지역사회를 섬기는 사역을 통해 하나님 나라를 세워가고 있습니다.',
  pastor: {
    name: '김성기',
    title: '담임목사',
    bio: '총신대학교 신학대학원(M.Div.) 졸업 후 순복음신학교에서 성령론을 연구하였습니다. 2005년부터 순복음성북교회 담임목사로 부임하여 교회 성장과 지역 선교에 힘쓰고 있습니다.',
    imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  worshipTimes: [
    { type: '주일 1부 예배', time: '오전 7:30', location: '본당' },
    { type: '주일 2부 예배', time: '오전 9:30', location: '본당' },
    { type: '주일 3부 예배', time: '오전 11:30', location: '본당' },
    { type: '주일 청년 예배', time: '오후 2:00', location: '청년부실' },
    { type: '수요 예배',     time: '오전 11:00', location: '본당' },
    { type: '금요 철야 예배', time: '오후 10:00', location: '본당' },
    { type: '새벽 예배',     time: '오전 5:30', location: '본당 (월–토)' },
  ],
  address: '서울특별시 성북구 동소문로 24길 18 순복음성북교회',
  phone: '02-929-5000',
  fax: '02-929-5001',
  website: 'https://sbfc.or.kr',
  youtube: 'https://youtube.com/@sbfc',
  mapEmbedQuery: '순복음성북교회+서울+성북구',
  imageUrl: 'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export default function ChurchInfoPage() {
  const { isPastor, isAdmin, user } = useAuth();
  const [hubView, setHubView] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const copyPhone = () => {
    navigator.clipboard.writeText(CHURCH.phone).catch(() => {});
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (hubView) {
    return (
      <FeatureHubPage
        title={CHURCH_INFO_HUB.title}
        description={CHURCH_INFO_HUB.description}
        features={CHURCH_INFO_HUB.features}
        viewer={{ isPastor, isAdmin, role: user?.role }}
        onSelect={() => setHubView(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <HubBackBar
        title="교회정보"
        description="우리 교회의 기본 정보를 확인하세요."
        onBack={() => setHubView(true)}
      />
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl">
        <img
          src={CHURCH.imageUrl}
          alt={CHURCH.name}
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Church className="w-4 h-4 text-white/70" />
            <span className="text-white/70 text-xs">{CHURCH.denomination}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{CHURCH.name}</h1>
          <p className="text-white/60 text-xs mt-0.5">창립 {CHURCH.founded}</p>
        </div>
      </div>

      {/* Intro */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<Church className="w-4 h-4" />} title="교회 소개" />
        <p className="text-sm text-gray-600 leading-relaxed mt-3">{CHURCH.intro}</p>
      </section>

      {/* Pastor */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<User className="w-4 h-4" />} title="담임목사 소개" />
        <div className="flex gap-4 mt-4">
          <img
            src={CHURCH.pastor.imageUrl}
            alt={CHURCH.pastor.name}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow"
          />
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">{CHURCH.pastor.name} {CHURCH.pastor.title}</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{CHURCH.pastor.bio}</p>
          </div>
        </div>
      </section>

      {/* Worship Times */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<Clock className="w-4 h-4" />} title="예배 시간" />
        <div className="mt-3 divide-y divide-gray-50">
          {CHURCH.worshipTimes.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{w.type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{w.location}</p>
              </div>
              <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {w.time}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <SectionTitle icon={<Phone className="w-4 h-4" />} title="연락처" />

        <InfoRow
          icon={<MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          label="주소"
          value={CHURCH.address}
        />

        <div className="flex items-start gap-3">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">전화번호</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">{CHURCH.phone}</span>
              <button
                onClick={copyPhone}
                className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded-full transition-colors"
              >
                {copiedPhone ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedPhone ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">홈페이지</p>
            <a
              href={CHURCH.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:underline flex items-center gap-1"
            >
              {CHURCH.website} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Youtube className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">유튜브</p>
            <a
              href={CHURCH.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:underline flex items-center gap-1"
            >
              {CHURCH.youtube} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Directions */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<MapPin className="w-4 h-4" />} title="오시는 길" />
        <div className="mt-4 overflow-hidden rounded-xl bg-gray-100 h-52 flex items-center justify-center relative">
          {/* Map placeholder — replace with real embed in production */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3">
            <MapPin className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400 font-medium text-center px-4">
              지도는 실제 서비스에서 표시됩니다
            </p>
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(CHURCH.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-xs px-4 py-2 rounded-full transition-colors"
            >
              카카오맵에서 보기 <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 leading-relaxed space-y-1">
          <p className="flex items-start gap-2"><span className="font-semibold text-gray-700 shrink-0">지하철</span> 4호선 성신여대입구역 4번 출구에서 도보 8분</p>
          <p className="flex items-start gap-2"><span className="font-semibold text-gray-700 shrink-0">버스</span> 성북구청 정류장 하차 (102, 108, 1111번 이용)</p>
          <p className="flex items-start gap-2"><span className="font-semibold text-gray-700 shrink-0">주차</span> 교회 지하 주차장 이용 가능 (주일 예배 무료)</p>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary-500">{icon}</span>
      <h2 className="font-bold text-gray-900 text-base">{title}</h2>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
