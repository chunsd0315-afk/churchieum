import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, AppUser } from '../lib/permissions';

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

// Demo accounts — pastor (super_admin / chief), pastor (assigned scopes), member
const DEMO_ACCOUNTS: Record<string, {
  password: string;
  name: string;
  role: UserRole;
  assignedDistrictIds?: string[];
  assignedZoneIds?: string[];
  assignedDepartmentIds?: string[];
  districtId?: string;
  zoneId?: string;
  departmentIds?: string[];
}> = {
  'pastor01@churchieum.com': {
    password: 'Church@2026',
    name: '김영수',
    role: 'super_admin',
    assignedDistrictIds: ['d1'],
    assignedZoneIds: ['z1'],
    assignedDepartmentIds: ['dep1'],
    districtId: 'd1',
    zoneId: 'z1',
    departmentIds: ['dep1'],
  },
  'pastor02@churchieum.com': {
    password: 'Church@2026',
    name: '이성호',
    role: 'pastor',
    assignedDistrictIds: ['d2'],
    assignedZoneIds: ['z3'],
    assignedDepartmentIds: ['dep1'],
    districtId: 'd2',
    zoneId: 'z3',
    departmentIds: ['dep1'],
  },
  'member60@demo.com': {
    password: 'Church@2026',
    name: '강수아',
    role: 'member',
    districtId: 'd1',
    zoneId: 'z3',
    departmentIds: ['dep3', 'dep5'],
  },
};

const STORAGE_KEY = 'churchieum_demo_user';

// Enrich a base AppUser with the latest saved data from clergy/member stores.
// Called at login and on page restore so profile updates are always reflected.
function enrichUserFromStorage(base: AppUser): AppUser {
  // 1. Try clergy_v1 (covers super_admin & pastor accounts)
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

  // 2. Try demo members (covers member accounts)
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
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AppUser;
        const enriched = enrichUserFromStorage(parsed);
        setUser(enriched);
        // Persist enriched version so next restore is up-to-date
        if (JSON.stringify(enriched) !== storedUser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
        }
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

    const base: AppUser = {
      id: `demo-${normalizedEmail.split('@')[0]}`,
      email: normalizedEmail,
      name: account.name,
      role: account.role,
      assignedDistrictIds: account.assignedDistrictIds,
      assignedZoneIds: account.assignedZoneIds,
      assignedDepartmentIds: account.assignedDepartmentIds,
      districtId: account.districtId,
      zoneId: account.zoneId,
      departmentIds: account.departmentIds,
    };

    // Enrich with latest persisted profile data
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
      const updated = { ...prev, ...updates };
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
