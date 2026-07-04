'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ExternalGuard() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const appOrigin = window.location.origin;

    const handlePop = () => {
      // If navigation would change origin or result in empty path, force back to app
      const currentOrigin = window.location.origin;
      const path = window.location.pathname || '';
      if (currentOrigin !== appOrigin || path === '') {
        const target = role === 'admin' ? '/admin' : role === 'pharmacie' ? '/pharmacie' : '/patient';
        // Use replace to avoid creating more history entries
        router.replace(target);
        // Ensure URL shown is app URL
        try { history.pushState(null, '', target); } catch {}
      }
      // Otherwise allow internal navigation
    };

    if (role) {
      // push a sentinel so there's always an entry to go back to inside the app
      try { history.pushState(null, '', window.location.href); } catch {}
      window.addEventListener('popstate', handlePop);
    }

    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, [role, router]);

  return null;
}
