import { prisma } from './prisma';
import { hashPassword } from './auth';

export async function ensureStarterLiveStreams() {
  // Mock data seeding disabled: platform relies strictly on real broadcaster streams
  return;
}
