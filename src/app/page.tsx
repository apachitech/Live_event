'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LiveDirectoryView from '@/components/stream/LiveDirectoryView';

function DirectoryContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const purchasedTokens = searchParams.get('purchased_tokens');
  const txId = searchParams.get('tx_id');

  return (
    <LiveDirectoryView
      initialCategory={initialCategory}
      purchasedTokens={purchasedTokens ? parseInt(purchasedTokens, 10) : undefined}
      txId={txId || undefined}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="w-8 h-8 border-3 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-4">Loading Live Directory...</p>
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}
