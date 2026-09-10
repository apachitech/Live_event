import { prisma } from '../lib/prisma';

export async function processEndedStreamsArchival() {
  console.log('[ArchivalWorker] Checking for ended streams to archive into VODs...');

  const endedStreams = await prisma.stream.findMany({
    where: {
      status: 'ENDED',
      endedAt: { not: null },
    },
    include: { streamer: true },
    take: 10,
  });

  for (const stream of endedStreams) {
    // Check if VOD already exists for this stream title/streamer
    const existingVod = await prisma.vod.findFirst({
      where: {
        streamerId: stream.streamerId,
        title: `VOD: ${stream.title}`,
      },
    });

    if (!existingVod) {
      const recordingUrl =
        stream.recordingUrl ||
        stream.externalStreamUrl ||
        `https://res.cloudinary.com/demo/video/upload/live_archive_${stream.id}.mp4`;

      const duration = stream.startedAt && stream.endedAt
        ? Math.floor((stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000)
        : 1800; // default 30 min

      await prisma.vod.create({
        data: {
          streamerId: stream.streamerId,
          title: `VOD: ${stream.title}`,
          description: `Archived live broadcast from ${stream.startedAt?.toLocaleDateString() || 'recent stream'}.`,
          videoUrl: recordingUrl,
          thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
          durationSeconds: duration,
          priceTokens: 0,
          isPublished: true,
          sourceType: stream.sourceType || 'CLOUDINARY',
        },
      });

      console.log(`[ArchivalWorker] Successfully archived stream "${stream.title}" into VOD.`);
    }
  }
}

if (require.main === module) {
  processEndedStreamsArchival()
    .then(() => {
      console.log('[ArchivalWorker] Archival check complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[ArchivalWorker] Error:', err);
      process.exit(1);
    });
}
