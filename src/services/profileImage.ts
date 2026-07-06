const PREFIX = 'churchieum_profile_img_';

export function getProfileImage(userId: string): string | null {
  return localStorage.getItem(PREFIX + userId);
}

export function saveProfileImage(userId: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      localStorage.setItem(PREFIX + userId, dataUrl);
      resolve(dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function removeProfileImage(userId: string): void {
  localStorage.removeItem(PREFIX + userId);
}
