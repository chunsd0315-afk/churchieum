import { Heart } from 'lucide-react';
import type { Page } from './Layout';
import type { Sermon } from '../../types/sermon';
import { useAuth } from '../../contexts/AuthContext';
import { canManageSermons, isSuperAdmin } from '../../lib/permissions';
import SermonApp from '../sermon/SermonApp';
import { SermonGraceFormView, GraceNoteDetailView, type SermonGraceFormCtx } from './GraceNotesView';
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
      canManageFolders={isSuperAdmin(user)}
      renderExtraActions={(sermon) => (
        <button
          type="button"
          onClick={() => openGrace(sermon)}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-semibold text-base hover:opacity-90 transition-opacity"
        >
          <Heart className="w-5 h-5" /> 은혜기록 작성
        </button>
      )}
    />
  );
}
