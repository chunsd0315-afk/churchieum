import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppUser } from '../services/permissions';
import {
  getDemoAccountMap,
  PRIMARY_DEMO_ACCOUNTS,
  buildDemoAppUser,
  isPrimaryDemoEmail,
  normalizePrimaryDemoUser,
} from '../config/demoAccounts';
import { migrateDemoUserStorage } from '../services/demoUserMigration';

type AuthContextType = {
  user: AppUser | null;
  isAdmin: boolean;
  isPastor: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  updateCurrentUser: (updates: Partial<AppUser>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS = getDemoAccountMap();

const STORAGE_KEY = 'churchieum_demo_user';

function mergePhoneFromClergy(base: AppUser): AppUser {
  try {
    const raw = localStorage.getItem('clergy_v1');
    if (!raw) return base;
    const list = JSON.parse(raw) as Array<{ email?: string; phone?: string }>;
    const match = list.find(c => c.email?.toLowerCase() === base.email.toLowerCase());
    if (match?.phone) return { ...base, phone: match.phone };
  } catch { /**/ }
  return base;
}

/** 대표 데모 계정은 canonical 유지, 그 외만 저장소에서 보강 */
function enrichUserFromStorage(base: AppUser): AppUser {
  if (isPrimaryDemoEmail(base.email)) {
    return mergePhoneFromClergy(normalizePrimaryDemoUser(base));
  }

  try {
    const raw = localStorage.getItem('clergy_v1');
    if (raw) {
      const list = JSON.parse(raw) as Array<{ email?: string; name?: string; position?: string; phone?: string }>;
      const match = list.find(c => c.email?.toLowerCase() === base.email.toLowerCase());
      if (match) {
        return {
          ...base,
          name: match.name ?? base.name,
          position: match.position ?? base.position,
          phone: match.phone ?? base.phone,
        };
      }
    }
  } catch { /**/ }

  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (raw) {
      const data = JSON.parse(raw) as {
        members?: Array<{ email?: string; name?: string; position?: string; phone?: string; districtId?: string; zoneId?: string; departmentIds?: string[] }>;
      };
      const match = data.members?.find(m => m.email?.toLowerCase() === base.email.toLowerCase());
      if (match) {
        return {
          ...base,
          name: match.name ?? base.name,
          position: match.position ?? base.position,
          phone: match.phone ?? base.phone,
          districtId: match.districtId ?? base.districtId,
          zoneId: match.zoneId ?? base.zoneId,
          departmentIds: match.departmentIds ?? base.departmentIds,
        };
      }
    }
  } catch { /**/ }

  return base;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    migrateDemoUserStorage();

    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AppUser;
        const enriched = enrichUserFromStorage(parsed);
        setUser(enriched);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.toLowerCase().trim();
    const account = DEMO_ACCOUNTS[normalizedEmail];
    if (!account) return { error: '등록되지 않은 이메일입니다.' };
    if (account.password !== password) return { error: '비밀번호가 올바르지 않습니다.' };

    const base = buildDemoAppUser(normalizedEmail);
    if (!base) return { error: '등록되지 않은 이메일입니다.' };

    const appUser = enrichUserFromStorage(base);

    setUser(appUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
    return { error: null };
  };

  const signUp = async (email: string, _password: string, _name: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.toLowerCase().trim();
    if (DEMO_ACCOUNTS[normalizedEmail]) return { error: '이미 등록된 이메일입니다.' };
    return { error: null };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateCurrentUser = (updates: Partial<AppUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...updates };
      const updated = isPrimaryDemoEmail(merged.email)
        ? normalizePrimaryDemoUser(merged)
        : merged;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = user?.role === 'super_admin';
  const isPastor = user?.role === 'pastor' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, isPastor, loading, signIn, signUp, signOut, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

/** 로그인 화면 체험용 계정 목록 (항상 3명, 고정 순서) */
export { PRIMARY_DEMO_ACCOUNTS };
