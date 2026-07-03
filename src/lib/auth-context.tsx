'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'patient' | 'pharmacie' | 'admin' | null;

interface AuthContextType {
  role: Role;
  userName: string;
  pharmacieId: number | null;
  login: (role: 'patient' | 'pharmacie' | 'admin', name: string, pharmacieId?: number) => void;
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

  const login = (r: 'patient' | 'pharmacie' | 'admin', name: string, phId?: number) => {
    setRole(r);
    setUserName(name);
    setPharmacieId(phId ?? null);
    if (r === 'patient') router.push('/patient');
    else if (r === 'pharmacie') router.push('/pharmacie');
    else router.push('/admin');
  };

  const logout = () => {
    setRole(null);
    setUserName('');
    setPharmacieId(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ role, userName, pharmacieId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
