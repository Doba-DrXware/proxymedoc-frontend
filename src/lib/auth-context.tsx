'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'patient' | 'pharmacie' | 'admin' | null;

interface AuthContextType {
  role: Role;
  userName: string;
  pharmacieId: number | null;
  login: (role: 'patient' | 'pharmacie' | 'admin', name: string, pharmacieId?: number, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: '',
  pharmacieId: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [userName, setUserName] = useState('');
  const [pharmacieId, setPharmacieId] = useState<number | null>(null);
  const router = useRouter();

  const clearSession = () => {
    setRole(null);
    setUserName('');
    setPharmacieId(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('proxymedoc_token');
        localStorage.removeItem('proxymedoc_profile');
      }
    } catch (e) {
      // ignore storage errors
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === 'undefined') return;

      try {
        const token = localStorage.getItem('proxymedoc_token');
        if (!token) {
          clearSession();
          return;
        }

        const res = await fetch('http://localhost:8081/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          clearSession();
          return;
        }

        const data = await res.json();
        const userRole = data.user?.role === 'pharmacie' ? 'pharmacie' : data.user?.role === 'admin' ? 'admin' : 'patient';
        setRole(userRole);
        setUserName(data.user?.name || data.user?.email || '');
        setPharmacieId(data.user?.pharmacieId ?? null);
        localStorage.setItem('proxymedoc_profile', JSON.stringify({ role: userRole, name: data.user?.name || data.user?.email || '', pharmacieId: data.user?.pharmacieId ?? null }));
      } catch (e) {
        clearSession();
      }
    };

    restoreSession();
  }, []);

  const login = (r: 'patient' | 'pharmacie' | 'admin', name: string, phId?: number, token?: string) => {
    setRole(r);
    setUserName(name);
    setPharmacieId(phId ?? null);
    try {
      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem('proxymedoc_token', token);
        } else {
          localStorage.removeItem('proxymedoc_token');
        }
        localStorage.setItem('proxymedoc_profile', JSON.stringify({ role: r, name, pharmacieId: phId ?? null }));
      }
    } catch (e) {
      // ignore storage errors
    }
    if (!token) {
      router.replace('/auth');
      return;
    }
    if (r === 'patient') router.replace('/patient');
    else if (r === 'pharmacie') router.replace('/pharmacie');
    else router.replace('/admin');
  };

  const logout = () => {
    clearSession();

    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/auth') {
        window.setTimeout(() => {
          window.location.replace('/auth');
        }, 0);
      }
      return;
    }

    router.replace('/auth');
  };

  return (
    <AuthContext.Provider value={{ role, userName, pharmacieId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
