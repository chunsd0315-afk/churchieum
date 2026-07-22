import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canManageSermons, canManageSermonFolders } from '../../services/permissions';
import SermonApp from '../../components/common/sermon/SermonApp';
import { SermonGraceFormView, type SermonGraceFormCtx } from '../../components/member/GraceNotesView';
import { useToast } from '../../components/common/ui';
import type { Sermon } from '../../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../../types/sermon';

type SubView = 'list' | 'grace-form';

export default function SermonManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [subView, setSubView] = useState<SubView>('list');
  const [graceCtx, setGraceCtx] = useState<SermonGraceFormCtx | null>(null);
  const [selectedSermonId, setSelectedSermonId] = useState<string | null>(null);

  const openGrace = (sermon: Sermon) => {
    setSelectedSermonId(sermon.id);
    setGraceCtx({
      sermonId: sermon.id,
      sermonTitle: sermon.title,
      sermonPreacher: sermon.preacher,
      sermonDate: sermon.sermonDate,
      bibleReference: sermon.scripture,
      worshipType: WORSHIP_TYPE_LABELS[sermon.worshipType],
      thumbnailUrl: sermon.thumbnailUrl,
      videoUrl: sermon.videoUrl,
      linkedFromSermon: true,
    });
    setSubView('grace-form');
  };

  if (subView === 'grace-form' && graceCtx) {
    return (
      <SermonGraceFormView
        ctx={graceCtx}
        onSave={() => {
          setGraceCtx(null);
          setSubView('list');
          toast.success('저장되었습니다.');
        }}
        onBack={() => { setGraceCtx(null); setSubView('list'); }}
      />
    );
  }

  return (
    <SermonApp
      canManage={canManageSermons(user)}
      canManageFolders={canManageSermonFolders(user)}
      onGraceWrite={openGrace}
      initialSelectedId={selectedSermonId}
    />
  );
}
