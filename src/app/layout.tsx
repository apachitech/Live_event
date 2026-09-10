import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import TokenPurchaseModal from '@/components/wallet/TokenPurchaseModal';
import AgeVerificationModal from '@/components/auth/AgeVerificationModal';

import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'PulseStream | Live Interactive Monetized Streaming Platform',
  description: 'Public stream rooms, virtual currency economy, interactive tipping menus, and private shows.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PulseStream',
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
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)] flex-1">
            {children}
          </main>
          <Footer />
          <TokenPurchaseModal />
          <AgeVerificationModal />
        </AuthProvider>
      </body>
    </html>
  );
}
