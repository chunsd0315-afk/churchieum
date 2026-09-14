import {
  Church, MapPin, Phone, Globe, Clock, User,
  ChevronRight, ExternalLink, Copy, Check, Quote, History,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeaderBar } from '../../components/common/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useChurchBasicProfile } from '../../hooks/useChurchBasicProfile';
import { getWebsiteDisplayLabel } from '../../services/churchProfileStorage';
import { resolveProfileImage } from '../../services/profileImage';
import { CHURCH_PROFILE_SEED } from '../../data/churchProfileSeed';

type InfoTab = 'basic' | 'pastor' | 'worship' | 'location' | 'history';

const TABS: { id: InfoTab; label: string }[] = [
  { id: 'basic', label: '기본정보' },
  { id: 'pastor', label: '담임목사 소개' },
  { id: 'worship', label: '예배안내' },
  { id: 'location', label: '오시는 길' },
  { id: 'history', label: '교회 연혁' },
];

export default function ChurchInfoPage() {
  const { isAdmin } = useAuth();
  const church = useChurchBasicProfile();
  const [tab, setTab] = useState<InfoTab>('basic');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const pastorImage = resolveProfileImage({
    userId: CHURCH_PROFILE_SEED.pastor.userId,
    role: 'super_admin',
    src: church.photoUrl || undefined,
  });
  const heroSrc = church.photoUrl || church.heroImageUrl;
  const siteLabel = getWebsiteDisplayLabel(church.website);
  const websiteHref = church.website.startsWith('http')
    ? church.website
    : `https://${church.website}`;

  const copyPhone = () => {
    navigator.clipboard.writeText(church.phone).catch(() => {});
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="space-y-5">
      <PageHeaderBar
        title="교회정보"
        description={isAdmin ? '우리 교회 기본정보를 확인·관리합니다.' : '우리 교회의 기본 정보를 확인하세요.'}
      />

      {/* 상단 요약 — 항상 노출 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative">
          <img
            src={heroSrc}
            alt={church.name}
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[11px] text-white/70 mb-0.5">교회정보</p>
            <h1 className="text-xl font-bold text-white leading-tight">{church.name}</h1>
            <p className="text-white/90 text-sm font-medium mt-1">{church.pastorName}</p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-50">
          <p className="text-sm font-bold text-gray-900 leading-snug">
            “{church.motto}”
          </p>
          <p className="text-xs text-gray-400 mt-1">2026 교회 표어</p>
        </div>
      </section>

      {/* 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'shrink-0 min-h-[44px] px-3.5 rounded-full text-sm font-semibold transition-colors',
              tab === t.id
                ? 'bg-primary-500 text-gray-900'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="space-y-4">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <SectionTitle icon={<Church className="w-4 h-4" />} title="교회 소개" />
            <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-line">
              {church.description}
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <SectionTitle icon={<Phone className="w-4 h-4" />} title="연락처" />
            <InfoRow
              icon={<MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              label="주소"
              value={church.postalCode
                ? `(${church.postalCode}) ${church.address}`
                : church.address}
            />
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">대표전화</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{church.phone}</span>
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
            {church.fax ? (
              <InfoRow
                icon={<Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                label="팩스"
                value={church.fax}
              />
            ) : null}
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">홈페이지</p>
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-600 hover:underline inline-flex items-center gap-1"
                >
                  {siteLabel} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-2 w-full min-h-[56px] rounded-btn bg-primary-500 hover:bg-primary-600 text-gray-900 font-bold text-sm transition-colors"
            >
              <Globe className="w-5 h-5" />
              공식 홈페이지
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <SectionTitle icon={<Quote className="w-4 h-4" />} title="2026 교회 표어" />
            <p className="mt-3 text-base font-bold text-gray-900 leading-snug">{church.motto}</p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <SectionTitle icon={<Clock className="w-4 h-4" />} title="예배 안내" />
            <div className="mt-3 divide-y divide-gray-50">
              {church.worshipTimes.slice(0, 4).map(w => (
                <div key={`${w.type}-${w.time}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{w.type}</p>
                    {w.location ? (
                      <p className="text-xs text-gray-400 mt-0.5">{w.location}</p>
                    ) : null}
                  </div>
                  <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    {w.time}
                  </span>
                </div>
              ))}
            </div>
            {church.worshipTimes.length > 4 ? (
              <button
                type="button"
                onClick={() => setTab('worship')}
                className="mt-2 text-sm font-semibold text-primary-600 touch-target"
              >
                전체 예배 안내 보기
              </button>
            ) : null}
          </section>

          <button
            type="button"
            onClick={() => setTab('location')}
            className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 min-h-[56px] touch-target"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <MapPin className="w-4 h-4 text-primary-500" />
              오시는 길
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {tab === 'pastor' && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<User className="w-4 h-4" />} title="담임목사 소개" />
          <div className="flex gap-4 mt-4">
            <img
              src={pastorImage}
              alt={church.pastorName}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow bg-amber-50"
            />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg leading-tight">{church.pastorName}</p>
              <p className="text-sm text-gray-500 mt-0.5">{church.pastorTitleLine}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                {church.pastorBio}
              </p>
            </div>
          </div>
        </section>
      )}

      {tab === 'worship' && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<Clock className="w-4 h-4" />} title="예배 안내" />
          <div className="mt-3 divide-y divide-gray-50">
            {church.worshipTimes.map(w => (
              <div key={`${w.type}-${w.time}-${w.day ?? ''}`} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{w.type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[w.day, w.location].filter(Boolean).join(' · ') || '본당'}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                  {w.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'location' && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<MapPin className="w-4 h-4" />} title="오시는 길" />
          <div className="mt-4 overflow-hidden rounded-xl bg-gray-100 h-52 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3">
              <MapPin className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-400 font-medium text-center px-4">
                지도는 실제 서비스에서 표시됩니다
              </p>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(church.address)}`}
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
              <span className="font-semibold text-gray-700 shrink-0">주소</span>
              {church.address}
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-gray-700 shrink-0">지하철</span>
              {church.directions.subway}
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-gray-700 shrink-0">버스</span>
              {church.directions.bus}
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-gray-700 shrink-0">주차</span>
              {church.directions.parking}
            </p>
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<History className="w-4 h-4" />} title="교회 연혁" />
          <ul className="mt-3 space-y-3">
            {church.history.map(item => (
              <li key={item.date} className="flex gap-3">
                <span className="text-xs font-bold text-primary-600 shrink-0 w-[4.5rem] pt-0.5">
                  {item.date}
                </span>
                <span className="text-sm text-gray-700 leading-snug">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
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
