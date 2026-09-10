import { prisma } from '../lib/prisma';

console.log('[Background Worker] Starting BullMQ Stream Processing & Payout Worker...');

async function runPeriodicTasks() {
  try {
    // 1. Check for expired subscriptions and renew/flag them
    const now = new Date();
    const expiredSubs = await prisma.subscription.findMany({
      where: { active: true, renewsAt: { lte: now } },
      include: { subscriber: { include: { wallet: true } }, streamer: true },
    });

    for (const sub of expiredSubs) {
      if (sub.subscriber.wallet && sub.subscriber.wallet.balance >= sub.monthlyTokenCost) {
        const nextRenew = new Date();
        nextRenew.setDate(nextRenew.getDate() + 30);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { renewsAt: nextRenew },
        });
        console.log(`[Worker] Renewed subscription ${sub.id} for user ${sub.subscriberId}`);
      } else {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { active: false },
        });
        console.log(`[Worker] Deactivated expired subscription ${sub.id} due to low tokens`);
      }
    }

    // 2. Archive streams that have been inactive
    const staleStreams = await prisma.stream.findMany({
      where: {
        status: 'LIVE',
        startedAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // over 24h
      },
    });

    for (const st of staleStreams) {
      await prisma.stream.update({
        where: { id: st.id },
        data: { status: 'ENDED', endedAt: new Date() },
      });
      console.log(`[Worker] Cleaned up stale stream ${st.id}`);
    }
  } catch (err) {
    console.error('[Worker Error]', err);
  }
}

// Run immediately, then repeat every 60 seconds
runPeriodicTasks();
setInterval(runPeriodicTasks, 60000);

console.log('[Background Worker] Running and listening for tasks.');
