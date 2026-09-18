import { prisma } from './prisma';
import { hashPassword } from './auth';

async function seed() {
  console.log('Seeding initial platform data...');

  const pwHash = await hashPassword('Password123!');

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.live' },
    create: {
      email: 'admin@platform.live',
      username: 'PlatformAdmin',
      passwordHash: pwHash,
      role: 'ADMIN',
      ageVerifiedAt: new Date('2020-01-01'),
      dob: new Date('1990-05-15'),
      wallet: { create: { balance: 10000, earnedBalance: 0 } },
    },
    update: {},
  });

  // 2. Streamer User
  const streamer = await prisma.user.upsert({
    where: { email: 'streamer@platform.live' },
    create: {
      email: 'streamer@platform.live',
      username: 'NeonNova',
      passwordHash: pwHash,
      role: 'STREAMER',
      ageVerifiedAt: new Date('2020-01-01'),
      dob: new Date('1995-08-20'),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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
              { label: 'VIP Sound Horn Alert', tokenCost: 10, description: 'Blast the airhorn sound effect' },
            ],
          },
        },
      },
    },
    update: {},
    include: { streamerProfile: true },
  });

  // 3. Second Streamer (Cosplay / Creative)
  const streamer2 = await prisma.user.upsert({
    where: { email: 'aurora@platform.live' },
    create: {
      email: 'aurora@platform.live',
      username: 'AuroraCraft',
      passwordHash: pwHash,
      role: 'STREAMER',
      ageVerifiedAt: new Date('2020-01-01'),
      dob: new Date('1998-03-12'),
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
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

  // 4. Viewer User
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@platform.live' },
    create: {
      email: 'viewer@platform.live',
      username: 'CyberViewer99',
      passwordHash: pwHash,
      role: 'VIEWER',
      ageVerifiedAt: new Date('2021-01-01'),
      dob: new Date('2000-11-03'),
      wallet: { create: { balance: 500, earnedBalance: 0 } },
    },
    update: {},
  });

  // 5. Google OAuth Tester / Streamer
  await prisma.user.upsert({
    where: { email: 'google.tester@platform.live' },
    create: {
      email: 'google.tester@platform.live',
      username: 'GoogleStreamer',
      passwordHash: pwHash,
      googleId: 'google_mock_10829384756',
      role: 'STREAMER',
      ageVerifiedAt: new Date('2021-01-01'),
      dob: new Date('1998-04-12'),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      wallet: { create: { balance: 500, earnedBalance: 250 } },
      streamerProfile: {
        create: {
          displayName: 'GoogleStreamer Live',
          bio: 'Official Google Streamer demo account! 🚀✨',
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      },
    },
    update: {
      passwordHash: pwHash,
      role: 'STREAMER',
    },
  });

  // 5. Active Live Streams
  if (streamer.streamerProfile) {
    const existingStream = await prisma.stream.findFirst({
      where: { streamerId: streamer.streamerProfile.id },
    });

    if (existingStream) {
      await prisma.stream.update({
        where: { id: existingStream.id },
        data: {
          status: 'LIVE',
          title: '🔥 Friday Cyber Night - Chill Beats & Ranked Matches',
          externalStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          viewerCount: 42,
        },
      });
    } else {
      const stream = await prisma.stream.create({
        data: {
          streamerId: streamer.streamerProfile.id,
          title: '🔥 Friday Cyber Night - Chill Beats & Ranked Matches',
          category: 'Gaming & Music',
          status: 'LIVE',
          roomName: `room_${streamer.streamerProfile.id}`,
          viewerCount: 42,
          totalTokensEarned: 840,
          startedAt: new Date(),
          privateRatePerMin: 75,
          externalStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        },
      });

      await prisma.tipGoal.create({
        data: {
          streamId: stream.id,
          label: 'Community Goal: New Studio Microphone',
          targetAmount: 1000,
          currentAmount: 430,
          active: true,
        },
      });

      // Sample chat messages
      await prisma.chatMessage.createMany({
        data: [
          { streamId: stream.id, userId: viewer.id, body: 'Hey everyone! Hyped for the stream!' },
          { streamId: stream.id, userId: admin.id, body: 'Welcome to the platform broadcast room!' },
        ],
      });
    }
  }

  if (streamer2.streamerProfile) {
    const existingStream2 = await prisma.stream.findFirst({
      where: { streamerId: streamer2.streamerProfile.id },
    });

    if (existingStream2) {
      await prisma.stream.update({
        where: { id: existingStream2.id },
        data: {
          status: 'LIVE',
          title: '🎨 Digital Art Workshop: Sci-Fi Character Concept',
          externalStreamUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
          viewerCount: 24,
        },
      });
    } else {
      const stream2 = await prisma.stream.create({
        data: {
          streamerId: streamer2.streamerProfile.id,
          title: '🎨 Digital Art Workshop: Sci-Fi Character Concept',
          category: 'Creative Arts',
          status: 'LIVE',
          roomName: `room_${streamer2.streamerProfile.id}`,
          viewerCount: 24,
          totalTokensEarned: 320,
          startedAt: new Date(),
          privateRatePerMin: 60,
          externalStreamUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        },
      });

      await prisma.tipGoal.create({
        data: {
          streamId: stream2.id,
          label: 'Unlock 4K Art Wallpaper Pack',
          targetAmount: 600,
          currentAmount: 320,
          active: true,
        },
      });
    }
  }

  // 6. Platform Settings
  await prisma.platformSetting.upsert({
    where: { key: 'REVENUE_SPLIT_STREAMER_PERCENT' },
    create: {
      key: 'REVENUE_SPLIT_STREAMER_PERCENT',
      value: '70',
      description: 'Percentage of tip/subscription tokens credited to streamers',
    },
    update: {},
  });

  await prisma.platformSetting.upsert({
    where: { key: 'MIN_PAYOUT_THRESHOLD_TOKENS' },
    create: {
      key: 'MIN_PAYOUT_THRESHOLD_TOKENS',
      value: '1000',
      description: 'Minimum token balance required to request cashout ($50 USD)',
    },
    update: {},
  });

  console.log('Seed completed successfully!');
  console.log('Sample Accounts:');
  console.log('- Admin:    admin@platform.live / Password123!');
  console.log('- Streamer: streamer@platform.live / Password123!');
  console.log('- Viewer:   viewer@platform.live / Password123!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
