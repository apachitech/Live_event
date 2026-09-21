'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import UserCampaignModal from './UserCampaignModal';

export default function GlobalCampaignModal() {
  const { isCampaignModalOpen, closeCampaignModal } = useAuth();

  return (
    <UserCampaignModal
      isOpen={isCampaignModalOpen}
      onClose={closeCampaignModal}
    />
  );
}
