import { useState } from 'react';
import { Heart } from 'lucide-react';
import type { Page } from './Layout';
import type { Sermon } from '../../lib/sermonStorage';
import SermonSharedView from '../shared/SermonSharedView';
import { SermonGraceFormView, GraceNoteDetailView, type SermonGraceFormCtx } from './GraceNotesView';

type SubView = 'list' | 'grace-form' | 'grace-detail';

export default function SermonPage({ onNavigate: _onNavigate }: { onNavigate?: (page: Page) => void }) {
  const [subView, setSubView] = useState<SubView>('list');
  const [graceCtx, setGraceCtx] = useState<SermonGraceFormCtx | null>(null);
  const [graceDetailId, setGraceDetailId] = useState<string | null>(null);

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
    <SermonSharedView
      isAdmin={false}
      renderActions={(sermon) => (
        <button
          onClick={() => openGrace(sermon)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Heart className="w-4 h-4" /> 은혜기록 작성
        </button>
      )}
    />
  );
}
