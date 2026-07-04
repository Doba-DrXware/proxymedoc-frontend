'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function NavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname) return;

    const normalized = pathname.toLowerCase();

    const isLanding = normalized === '/' || normalized === '/landing';
    const isAuth = normalized === '/auth' || normalized.startsWith('/auth/');

    if (role) {
      // authenticated: only allow paths under their role
      const allowedPrefix = role === 'admin' ? '/admin' : role === 'pharmacie' ? '/pharmacie' : '/patient';
      if (normalized === allowedPrefix || normalized.startsWith(allowedPrefix + '/') ) {
        return;
      }

      // if trying to access auth/landing or other pages, redirect back to role root
      router.replace(allowedPrefix);
      try { history.replaceState(null, '', allowedPrefix); } catch {}
      return;
    } else {
      // unauthenticated: only allow landing and auth pages
      if (isLanding || isAuth) return;
      router.replace('/auth');
      try { history.replaceState(null, '', '/auth'); } catch {}
      return;
    }
  }, [pathname, role, router]);

  return null;
}
