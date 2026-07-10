import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import { hashPin, verifyPin } from '@/lib/pin';
import * as db from '@/lib/db';
import { saveUsersToCloud, getUsersFromCloud, type CloudUser } from '@/lib/firebase';

const SESSION_KEY = 'erp_current_user_id';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30_000;

const toCloudUser = (user: User): CloudUser => ({
  id: user.id,
  name: user.name,
  pinHash: user.pinHash,
  role: user.role,
  createdAt: user.createdAt,
});

async function syncUsersToCloud(users: User[]): Promise<void> {
  await saveUsersToCloud(users.map(toCloudUser));
}

interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  loginAttempts: number;
  lockedUntil: number | null;
}

interface AuthContextValue extends AuthState {
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setupAdmin: (name: string, pin: string) => Promise<void>;
  addUser: (name: string, pin: string, role: User['role']) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    users: [],
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    loginAttempts: 0,
    lockedUntil: null,
  });

  const loadUsers = useCallback(async () => {
    const users = await db.getAllUsers();
    setState((prev) => ({ ...prev, users }));
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const userId = sessionStorage.getItem(SESSION_KEY);
      let users = await db.getAllUsers();
      
      if (users.length === 0) {
        const cloudUsers = await getUsersFromCloud();
        if (cloudUsers.length > 0) {
          users = cloudUsers.map((cu) => ({
            id: cu.id,
            name: cu.name,
            pinHash: cu.pinHash,
            role: cu.role,
            createdAt: cu.createdAt,
          }));
          for (const user of users) {
            await db.addUser(user);
          }
        }
      }

      const currentUser = users.find((u) => u.id === userId) || null;
      setState((prev) => ({
        ...prev,
        user: currentUser,
        users,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      const now = Date.now();
      if (state.lockedUntil && now < state.lockedUntil) {
        const remaining = Math.ceil((state.lockedUntil - now) / 1000);
        return { success: false, error: `Trop de tentatives. Réessayez dans ${remaining}s` };
      }

      const users = await db.getAllUsers();
      for (const u of users) {
        const valid = await verifyPin(pin, u.pinHash);
        if (valid) {
          sessionStorage.setItem(SESSION_KEY, u.id);
          setState((prev) => ({
            ...prev,
            user: u,
            users,
            isAuthenticated: true,
            isAdmin: u.role === 'admin',
            loginAttempts: 0,
            lockedUntil: null,
          }));
          return { success: true };
        }
      }

      const attempts = state.loginAttempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        setState((prev) => ({
          ...prev,
          loginAttempts: 0,
          lockedUntil: Date.now() + LOCKOUT_DURATION,
        }));
        return { success: false, error: 'Compte verrouillé pendant 30 secondes' };
      }

      setState((prev) => ({ ...prev, loginAttempts: attempts }));
      return {
        success: false,
        error: `PIN incorrect (${attempts}/${MAX_ATTEMPTS})`,
      };
    },
    [state.loginAttempts, state.lockedUntil]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loginAttempts: 0,
      lockedUntil: null,
    }));
  }, []);

  const setupAdmin = useCallback(
    async (name: string, pin: string) => {
      const pinHash = await hashPin(pin);
      const admin: User = {
        id: `user-${Date.now()}`,
        name,
        pinHash,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await db.addUser(admin);
      sessionStorage.setItem(SESSION_KEY, admin.id);
      setState((prev) => {
        const users = [...prev.users, admin];
        syncUsersToCloud(users).catch(console.error);
        return {
          ...prev,
          user: admin,
          users,
          isAuthenticated: true,
          isAdmin: true,
        };
      });
    },
    []
  );

  const addUser = useCallback(
    async (name: string, pin: string, role: User['role']) => {
      const pinHash = await hashPin(pin);
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        pinHash,
        role,
        createdAt: new Date().toISOString(),
      };
      await db.addUser(newUser);
      setState((prev) => {
        const users = [...prev.users, newUser];
        syncUsersToCloud(users).catch(console.error);
        return { ...prev, users };
      });
    },
    []
  );

  const removeUser = useCallback(
    async (id: string) => {
      await db.deleteUser(id);
      setState((prev) => {
        const users = prev.users.filter((u) => u.id !== id);
        syncUsersToCloud(users).catch(console.error);
        if (prev.user?.id === id) {
          sessionStorage.removeItem(SESSION_KEY);
          return {
            ...prev,
            user: null,
            users,
            isAuthenticated: false,
            isAdmin: false,
          };
        }
        return { ...prev, users };
      });
    },
    []
  );

  const refreshUsers = useCallback(async () => {
    const users = await db.getAllUsers();
    setState((prev) => ({ ...prev, users }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        setupAdmin,
        addUser,
        removeUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
