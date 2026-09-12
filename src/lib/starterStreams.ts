import { prisma } from './prisma';
import { hashPassword } from './auth';

export async function ensureStarterLiveStreams() {
  try {
    const streamCount = await prisma.stream.count({
      where: {
        status: { in: ['LIVE', 'PRIVATE'] },
      },
    });

    if (streamCount > 0) {
      return;
    }

    // Provision or find initial demo streamers
    const pwHash = await hashPassword('Password123!');

    const streamerUser1 = await prisma.user.upsert({
      where: { email: 'streamer@platform.live' },
      create: {
        email: 'streamer@platform.live',
        username: 'NeonNova',
        passwordHash: pwHash,
        role: 'STREAMER',
        ageVerifiedAt: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        wallet: { create: { balance: 250, earnedBalance: 1450 } },
        streamerProfile: {
          create: {
            displayName: 'NeonNova Live',
            bio: 'Cyberpunk beats, high-energy gaming & late-night chill vibes! 🎧✨',
            kycStatus: 'VERIFIED',
            kycVerifiedAt: new Date(),
            tipMenus: {
              create: [
                { label: 'Play Song Request', tokenCost: 25, description: 'Pick any track for the playlist' },
                { label: 'Dance Break / Celebration', tokenCost: 50, description: '30-second on-screen victory dance' },
                { label: '1v1 Viewer Match', tokenCost: 150, description: 'Play the next round together' },
              ],
            },
          },
        },
      },
      update: {},
      include: { streamerProfile: true },
    });

    const streamerUser2 = await prisma.user.upsert({
      where: { email: 'aurora@platform.live' },
      create: {
        email: 'aurora@platform.live',
        username: 'AuroraCraft',
        passwordHash: pwHash,
        role: 'STREAMER',
        ageVerifiedAt: new Date(),
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        wallet: { create: { balance: 100, earnedBalance: 820 } },
        streamerProfile: {
          create: {
            displayName: 'AuroraCraft Studio',
            bio: 'Live digital painting, concept art & chill community chat. 🎨🖌️',
            kycStatus: 'VERIFIED',
            kycVerifiedAt: new Date(),
            tipMenus: {
              create: [
                { label: 'Quick Doodled Portrait', tokenCost: 100, description: 'Speed sketch of your avatar' },
                { label: 'Pick Color Palette', tokenCost: 35, description: 'Choose the next painting scheme' },
              ],
            },
          },
        },
      },
      update: {},
      include: { streamerProfile: true },
    });

    if (streamerUser1.streamerProfile) {
      await prisma.stream.create({
        data: {
          streamerId: streamerUser1.streamerProfile.id,
          title: '🔥 Friday Cyber Night - Chill Beats & Ranked Matches',
          category: 'Gaming & Music',
          status: 'LIVE',
          roomName: `room_${streamerUser1.streamerProfile.id}_starter`,
          viewerCount: 42,
          totalTokensEarned: 840,
          startedAt: new Date(),
          privateRatePerMin: 75,
          tipGoals: {
            create: {
              label: 'Community Goal: New Studio Microphone',
              targetAmount: 1000,
              currentAmount: 430,
              active: true,
            },
          },
        },
      });
    }

    if (streamerUser2.streamerProfile) {
      await prisma.stream.create({
        data: {
          streamerId: streamerUser2.streamerProfile.id,
          title: '🎨 Digital Art Workshop: Sci-Fi Character Concept',
          category: 'Creative Arts',
          status: 'LIVE',
          roomName: `room_${streamerUser2.streamerProfile.id}_starter`,
          viewerCount: 18,
          totalTokensEarned: 320,
          startedAt: new Date(),
          privateRatePerMin: 60,
          tipGoals: {
            create: {
              label: 'Unlock 4K Art Wallpaper Pack',
              targetAmount: 600,
              currentAmount: 320,
              active: true,
            },
          },
        },
      });
    }
  } catch (err: any) {
    console.warn('Notice in ensureStarterLiveStreams:', err.message);
  }
}
