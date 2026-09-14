import {
  Church, MapPin, Phone, Globe, Clock, User,
  ChevronRight, ExternalLink, Copy, Check, Quote, History,
} from 'lucide-react';
import { useState } from 'react';
import { FeatureHubPage, HubBackBar } from '../../components/common/feature-hub';
import { CHURCH_INFO_HUB } from '../../config/featureHub/memberHubs';
import { useAuth } from '../../contexts/AuthContext';
import { CHURCH_PROFILE_SEED } from '../../data/churchProfileSeed';
import { resolveProfileImage } from '../../services/profileImage';

const CHURCH = CHURCH_PROFILE_SEED;

export default function ChurchInfoPage() {
  const { isPastor, isAdmin, user } = useAuth();
  const [hubView, setHubView] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const pastorImage = resolveProfileImage({
    userId: CHURCH.pastor.userId,
    role: 'super_admin',
  });

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
          src={CHURCH.heroImageUrl}
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
          <p className="text-white/80 text-sm mt-1 font-medium">{CHURCH.pastor.displayName}</p>
        </div>
      </div>

      {/* 담임목사 (요약) */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <p className="text-xs text-gray-400 font-medium mb-1">담임목사</p>
        <p className="text-lg font-bold text-gray-900">{CHURCH.pastor.displayName}</p>
      </section>

      {/* Intro */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<Church className="w-4 h-4" />} title="교회 소개" />
        <p className="text-base font-bold text-gray-900 mt-3">{CHURCH.introTitle}</p>
        <p className="text-sm text-gray-600 leading-relaxed mt-2 whitespace-pre-line">{CHURCH.intro}</p>
      </section>

      {/* Motto */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<Quote className="w-4 h-4" />} title="교회 표어" />
        <p className="mt-3 text-base font-bold text-gray-900 leading-snug">
          {CHURCH.motto}
        </p>
        <p className="text-xs text-gray-400 mt-1">2026</p>
      </section>

      {/* Pastor */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<User className="w-4 h-4" />} title="담임목사 소개" />
        <div className="flex gap-4 mt-4">
          <img
            src={pastorImage}
            alt={CHURCH.pastor.displayName}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow bg-amber-50"
          />
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight">
              {CHURCH.pastor.displayName}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{CHURCH.pastor.titleLine}</p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
              {CHURCH.pastor.bio}
            </p>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<History className="w-4 h-4" />} title="교회 연혁" />
        <ul className="mt-3 space-y-3">
          {CHURCH.history.map((item) => (
            <li key={item.date} className="flex gap-3">
              <span className="text-xs font-bold text-primary-600 shrink-0 w-[4.5rem] pt-0.5">
                {item.date}
              </span>
              <span className="text-sm text-gray-700 leading-snug">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Worship Times */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<Clock className="w-4 h-4" />} title="예배 안내" />
        <div className="mt-3 divide-y divide-gray-50">
          {CHURCH.worshipTimes.map((w) => (
            <div key={w.type} className="flex items-center justify-between py-3">
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

      {/* Directions */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<MapPin className="w-4 h-4" />} title="오시는 길" />
        <div className="mt-4 overflow-hidden rounded-xl bg-gray-100 h-52 flex items-center justify-center relative">
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
          <p className="flex items-start gap-2">
            <span className="font-semibold text-gray-700 shrink-0">지하철</span>
            {CHURCH.directions.subway}
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-gray-700 shrink-0">버스</span>
            {CHURCH.directions.bus}
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-gray-700 shrink-0">주차</span>
            {CHURCH.directions.parking}
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <SectionTitle icon={<Phone className="w-4 h-4" />} title="연락처" />

        <InfoRow
          icon={<MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          label="주소"
          value={`(${CHURCH.postalCode}) ${CHURCH.address}`}
        />

        <div className="flex items-start gap-3">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">전화</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800">{CHURCH.phone}</span>
              <button
                type="button"
                onClick={copyPhone}
                className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded-full transition-colors min-h-[32px]"
              >
                {copiedPhone ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedPhone ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        </div>

        <InfoRow
          icon={<Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          label="팩스"
          value={CHURCH.fax}
        />

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
              {CHURCH.websiteLabel} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <a
          href={CHURCH.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 w-full min-h-[56px] rounded-btn bg-primary-500 hover:bg-primary-600 text-gray-900 font-bold text-sm transition-colors"
        >
          <Globe className="w-5 h-5" />
          공식 홈페이지
          <ExternalLink className="w-4 h-4" />
        </a>
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
