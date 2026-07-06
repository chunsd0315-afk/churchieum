import { useState } from 'react';
import { supabase } from '../services/supabase';

type UploadOptions = {
  bucket: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
};

type UploadState = {
  uploading: boolean;
  progress: number;
  error: string;
};

export function useFileUpload(options: UploadOptions) {
  const [state, setState] = useState<UploadState>({ uploading: false, progress: 0, error: '' });

  const upload = async (file: File): Promise<string | null> => {
    const maxBytes = (options.maxSizeMB ?? 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      setState(s => ({ ...s, error: `파일 크기는 ${options.maxSizeMB ?? 10}MB 이하여야 합니다` }));
      return null;
    }

    setState({ uploading: true, progress: 0, error: '' });

    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = options.folder ? `${options.folder}/${name}` : name;

    const { error } = await supabase.storage.from(options.bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      setState({ uploading: false, progress: 0, error: `업로드 실패: ${error.message}` });
      return null;
    }

    const { data } = supabase.storage.from(options.bucket).getPublicUrl(path);
    setState({ uploading: false, progress: 100, error: '' });
    return data.publicUrl;
  };

  const clearError = () => setState(s => ({ ...s, error: '' }));

  return { ...state, upload, clearError };
}
