import { prisma } from '../prisma';
import { TransactionType } from '@/types';

export async function getPlatformRevenueSplit(): Promise<{ streamerPercent: number; platformPercent: number }> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'REVENUE_SPLIT_STREAMER_PERCENT' },
    });
    const streamerPercent = setting ? parseInt(setting.value, 10) : 70;
    return {
      streamerPercent,
      platformPercent: 100 - streamerPercent,
    };
  } catch {
    return { streamerPercent: 70, platformPercent: 30 };
  }
}

export class WalletService {
  /**
   * Credit tokens to user wallet upon package purchase (logged in Transaction ledger)
   */
  static async creditPurchasedTokens(userId: string, tokens: number, fiatAmountCents: number, paymentRef: string) {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: tokens, earnedBalance: 0 },
        update: { balance: { increment: tokens } },
      });

      const transaction = await tx.transaction.create({
        data: {
          recipientId: userId,
          type: 'PURCHASE',
          amount: tokens,
          fiatAmountCents,
          netTokens: tokens,
          platformFeeTokens: 0,
          memo: `Purchased ${tokens} tokens via checkout`,
          metadata: JSON.stringify({ paymentRef }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'WALLET_PURCHASE',
          entityType: 'TRANSACTION',
          entityId: transaction.id,
          payload: JSON.stringify({ tokens, fiatAmountCents, newBalance: wallet.balance }),
        },
      });

      return { wallet, transaction };
    });

    // Asynchronously dispatch payment slip to customer and admin messaging addresses
    try {
      const { ReceiptService } = await import('@/lib/messaging/receiptService');
      ReceiptService.sendPurchaseSlip({
        userId,
        tokens,
        fiatAmountCents,
        paymentRef,
        transactionId: result.transaction.id,
      }).catch((err) => console.warn('[ReceiptService] Non-blocking dispatch error:', err));
    } catch (e) {
      console.warn('[ReceiptService] Failed to load receipt service:', e);
    }

    return result;
  }

  /**
   * Execute tip transfer from viewer to streamer, calculating platform fee & net split,
   * updating stream earnings, and logging immutable ledger transaction.
   */
  static async sendTip(params: {
    senderUserId: string;
    streamerUserId: string;
    streamId: string;
    tokenAmount: number;
    message?: string;
    menuItemLabel?: string;
  }) {
    const { senderUserId, streamerUserId, streamId, tokenAmount, message, menuItemLabel } = params;

    if (tokenAmount <= 0) {
      throw new Error('Tip amount must be positive');
    }

    const { streamerPercent } = await getPlatformRevenueSplit();
    const netTokens = Math.floor((tokenAmount * streamerPercent) / 100);
    const platformFeeTokens = tokenAmount - netTokens;

    return prisma.$transaction(async (tx) => {
      // 1. Fetch sender wallet and verify balance
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: senderUserId },
      });

      if (!senderWallet || senderWallet.balance < tokenAmount) {
        throw new Error('Insufficient token balance');
      }

      // 2. Debit sender wallet
      const updatedSenderWallet = await tx.wallet.update({
        where: { userId: senderUserId },
        data: { balance: { decrement: tokenAmount } },
      });

      // 3. Credit streamer wallet (both balance and cashable earnedBalance)
      const updatedStreamerWallet = await tx.wallet.upsert({
        where: { userId: streamerUserId },
        create: {
          userId: streamerUserId,
          balance: netTokens,
          earnedBalance: netTokens,
        },
        update: {
          balance: { increment: netTokens },
          earnedBalance: { increment: netTokens },
        },
      });

      // 4. Update stream statistics
      await tx.stream.update({
        where: { id: streamId },
        data: { totalTokensEarned: { increment: tokenAmount } },
      });

      // 5. Update active tip goals if any
      const activeGoals = await tx.tipGoal.findMany({
        where: { streamId, active: true, reached: false },
      });

      for (const goal of activeGoals) {
        const newTotal = goal.currentAmount + tokenAmount;
        const reached = newTotal >= goal.targetAmount;
        await tx.tipGoal.update({
          where: { id: goal.id },
          data: {
            currentAmount: newTotal,
            reached,
          },
        });
      }

      // 6. Create immutable ledger record
      const memoParts = [menuItemLabel ? `[Menu: ${menuItemLabel}]` : null, message].filter(Boolean);
      const transaction = await tx.transaction.create({
        data: {
          senderId: senderUserId,
          recipientId: streamerUserId,
          streamId,
          type: 'TIP',
          amount: tokenAmount,
          netTokens,
          platformFeeTokens,
          memo: memoParts.join(' - ') || 'Stream tip',
          metadata: JSON.stringify({ menuItemLabel, message, streamerPercent }),
        },
      });

      // Hard copy change data into AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: senderUserId,
          action: 'STREAM_TIP',
          entityType: 'TRANSACTION',
          entityId: transaction.id,
          payload: JSON.stringify({
            streamerUserId,
            streamId,
            tokenAmount,
            netTokens,
            platformFeeTokens,
            menuItemLabel,
          }),
        },
      });

      return {
        transaction,
        senderBalance: updatedSenderWallet.balance,
        streamerBalance: updatedStreamerWallet.earnedBalance,
        netTokens,
      };
    });
  }

  /**
   * Process private show per-minute or flat billing deduction
   */
  static async debitPrivateShowMinute(params: {
    viewerUserId: string;
    streamerUserId: string;
    streamId: string;
    ratePerMin: number;
    minuteNumber: number;
  }) {
    const { viewerUserId, streamerUserId, streamId, ratePerMin, minuteNumber } = params;
    const { streamerPercent } = await getPlatformRevenueSplit();
    const netTokens = Math.floor((ratePerMin * streamerPercent) / 100);
    const platformFee = ratePerMin - netTokens;

    return prisma.$transaction(async (tx) => {
      const viewerWallet = await tx.wallet.findUnique({
        where: { userId: viewerUserId },
      });

      if (!viewerWallet || viewerWallet.balance < ratePerMin) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      await tx.wallet.update({
        where: { userId: viewerUserId },
        data: { balance: { decrement: ratePerMin } },
      });

      await tx.wallet.upsert({
        where: { userId: streamerUserId },
        create: { userId: streamerUserId, balance: netTokens, earnedBalance: netTokens },
        update: {
          balance: { increment: netTokens },
          earnedBalance: { increment: netTokens },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          senderId: viewerUserId,
          recipientId: streamerUserId,
          streamId,
          type: 'PRIVATE_SHOW',
          amount: ratePerMin,
          netTokens,
          platformFeeTokens: platformFee,
          memo: `Private Show - Minute #${minuteNumber}`,
        },
      });

      // Hard copy change data into AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: viewerUserId,
          action: 'PRIVATE_SHOW_BILLING',
          entityType: 'TRANSACTION',
          entityId: transaction.id,
          payload: JSON.stringify({
            streamerUserId,
            streamId,
            ratePerMin,
            minuteNumber,
            netTokens,
            platformFee,
          }),
        },
      });

      return { success: true, transaction, remainingBalance: viewerWallet.balance - ratePerMin };
    });
  }
}
