import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import Navbar from '@/components/Navbar';
import TokenPurchaseModal from '@/components/wallet/TokenPurchaseModal';
import AgeVerificationModal from '@/components/auth/AgeVerificationModal';

import { Footer } from '@/components/layout/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  title: 'PulseStream | Live Interactive Monetized Streaming Platform',
  description: 'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PulseStream',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-100 antialiased selection:bg-purple-600 selection:text-white">
        <AuthProvider>
          <SiteConfigProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-4rem)] flex-1">
              {children}
            </main>
            <Footer />
            <TokenPurchaseModal />
            <AgeVerificationModal />
          </SiteConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
