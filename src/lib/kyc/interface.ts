export interface KYCVerificationResult {
  success: boolean;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  dob?: Date;
  isOver18: boolean;
  referenceId?: string;
  rejectionReason?: string;
}

export interface KYCProvider {
  name: string;
  verifyAgeSelfAttestation(userId: string, birthDate: Date, agreedToTerms: boolean): Promise<KYCVerificationResult>;
  initiateStreamerIDV(userId: string, returnUrl: string): Promise<{ verificationUrl: string; sessionId: string }>;
  checkVerificationStatus(sessionId: string): Promise<KYCVerificationResult>;
}
