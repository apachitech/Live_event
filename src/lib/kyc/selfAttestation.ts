import { KYCProvider, KYCVerificationResult } from './interface';

export class SelfAttestationKYCProvider implements KYCProvider {
  name = 'SelfAttestation';

  async verifyAgeSelfAttestation(userId: string, birthDate: Date, agreedToTerms: boolean): Promise<KYCVerificationResult> {
    if (!agreedToTerms) {
      return {
        success: false,
        status: 'REJECTED',
        isOver18: false,
        rejectionReason: 'Terms and age attestation must be accepted.',
      };
    }

    const today = new Date();
    const ageDiff = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const actualAge = (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ? ageDiff - 1 : ageDiff;

    if (actualAge < 18) {
      return {
        success: false,
        status: 'REJECTED',
        dob: birthDate,
        isOver18: false,
        rejectionReason: 'You must be at least 18 years of age to access this platform.',
      };
    }

    return {
      success: true,
      status: 'VERIFIED',
      dob: birthDate,
      isOver18: true,
      referenceId: `self_attest_${userId}_${Date.now()}`,
    };
  }

  async initiateStreamerIDV(userId: string, returnUrl: string): Promise<{ verificationUrl: string; sessionId: string }> {
    const sessionId = `sim_idv_${userId}_${Date.now()}`;
    return {
      verificationUrl: `${returnUrl}?sessionId=${sessionId}&mock_idv=success`,
      sessionId,
    };
  }

  async checkVerificationStatus(sessionId: string): Promise<KYCVerificationResult> {
    return {
      success: true,
      status: 'VERIFIED',
      isOver18: true,
      referenceId: sessionId,
    };
  }
}

export const defaultKYCProvider = new SelfAttestationKYCProvider();
