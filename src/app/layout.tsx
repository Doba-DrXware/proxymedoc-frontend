import type { Metadata } from 'next';
import './globals.css';
import Image from 'next/image';
import { AuthProvider } from '@/lib/auth-context';
import { StoreProvider } from '@/lib/store-context';
import NavigationGuard from '@/components/NavigationGuard';

export const metadata: Metadata = {
  title: 'ProxyMédoc — Trouvez vos médicaments',
  description: 'Plateforme de géolocalisation de pharmacies au Cameroun',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha512-sA+gG9+0nM10+VHPb0wZSGWc+J9Lq7uEY6FQkNc0+LZ4prS5jl7xQXOLcyHq9nBiRn2CzR0QIWK4WrRIRy3gYQ=="
          crossOrigin=""
        />
      </head>
      <body>
        <AuthProvider>
          <StoreProvider>
            <NavigationGuard />
            <header className="flex items-center gap-4 p-4">
              <Image src="/proxymedoc-logo.png" alt="ProxyMédoc" width={64} height={64} />
              <div>
                <h1 className="text-xl font-semibold">ProxyMédoc</h1>
                <p className="text-sm text-slate-500">Pharmacie de Proximité</p>
              </div>
            </header>

            {children}
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
