import { Heart } from 'lucide-react';
import type { Page } from '../../components/member/Layout';
import type { Sermon } from '../../types/sermon';
import { useAuth } from '../../contexts/AuthContext';
import { canManageSermons, canManageSermonFolders } from '../../services/permissions';
import SermonApp from '../../components/common/sermon/SermonApp';
import { SermonGraceFormView, GraceNoteDetailView, type SermonGraceFormCtx } from '../../components/member/GraceNotesView';
import { useState } from 'react';

type SubView = 'list' | 'grace-form' | 'grace-detail';

export default function SermonPage({ onNavigate: _onNavigate }: { onNavigate?: (page: Page) => void }) {
  const { user } = useAuth();
  const [subView, setSubView] = useState<SubView>('list');
  const [graceCtx, setGraceCtx] = useState<SermonGraceFormCtx | null>(null);
  const [graceDetailId, setGraceDetailId] = useState<string | null>(null);

  const canManage = canManageSermons(user);

  const openGrace = (sermon: Sermon) => {
    setGraceCtx({
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      sermonPreacher: sermon.preacher,
      sermonDate: sermon.sermonDate,
      bibleReference: sermon.scripture,
    });
    setSubView('grace-form');
  };

  if (subView === 'grace-form' && graceCtx) {
    return (
      <SermonGraceFormView
        ctx={graceCtx}
        onSave={id => { setGraceDetailId(id); setGraceCtx(null); setSubView('grace-detail'); }}
        onBack={() => { setGraceCtx(null); setSubView('list'); }}
      />
    );
  }

  if (subView === 'grace-detail' && graceDetailId) {
    return (
      <GraceNoteDetailView
        noteId={graceDetailId}
        onBack={() => { setGraceDetailId(null); setSubView('list'); }}
        onEdit={() => {}}
        onDelete={() => { setGraceDetailId(null); setSubView('list'); }}
      />
    );
  }

  return (
    <SermonApp
      canManage={canManage}
      canManageFolders={canManageSermonFolders(user)}
      renderExtraActions={(sermon) => (
        <button
          type="button"
          onClick={() => openGrace(sermon)}
          className="w-full flex items-center justify-center gap-2 h-14 bg-primary-600 text-white rounded-[14px] font-bold text-base hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Heart className="w-5 h-5" /> 은혜기록 작성
        </button>
      )}
    />
  );
}
