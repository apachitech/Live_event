'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LiveDirectoryView from '@/components/stream/LiveDirectoryView';

function LivePageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  return <LiveDirectoryView initialCategory={initialCategory} />;
}

export default function LiveDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="w-8 h-8 border-3 border-brandPurple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-4">Loading Live Directory...</p>
        </div>
      }
    >
      <LivePageContent />
    </Suspense>
  );
}
