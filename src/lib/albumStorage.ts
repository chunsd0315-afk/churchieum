/**
 * Storage abstraction for album photos.
 * In demo mode, files are kept as local blob URLs without server upload.
 * Set STORAGE_MODE to 'supabase' (or 'firebase' in the future) for real uploads.
 */

import { supabase } from './supabase';

export type StorageMode = 'demo' | 'supabase';
export const STORAGE_MODE: StorageMode = 'supabase';

export type UploadResult = {
  url: string;
  isLocal: boolean;
};

export type UploadProgress = {
  fileIndex: number;
  total: number;
  done: number;
};

export async function uploadAlbumPhoto(
  file: File,
  albumId: string,
  onProgress?: (p: UploadProgress & { fileIndex: number }) => void,
  fileIndex = 0,
  total = 1,
): Promise<UploadResult> {
  if (STORAGE_MODE === 'demo') {
    await new Promise(r => setTimeout(r, 200));
    onProgress?.({ fileIndex, total, done: fileIndex + 1 });
    return { url: URL.createObjectURL(file), isLocal: true };
  }

  // Supabase upload
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `albums/${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('albums').upload(path, file, { cacheControl: '3600' });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('albums').getPublicUrl(path);
  onProgress?.({ fileIndex, total, done: fileIndex + 1 });
  return { url: data.publicUrl, isLocal: false };
}

export async function uploadCoverPhoto(file: File, albumId: string): Promise<string> {
  if (STORAGE_MODE === 'demo') {
    return URL.createObjectURL(file);
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `albums/covers/${albumId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('albums').upload(path, file, { cacheControl: '3600', upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('albums').getPublicUrl(path);
  return data.publicUrl;
}
