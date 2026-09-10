export interface ExternalTriggerEvent {
  event: 'tip' | 'goal_reached' | 'private_started' | 'private_ended';
  streamId: string;
  streamerId: string;
  senderUsername?: string;
  tokens: number;
  menuItemLabel?: string;
  timestamp: string;
}

export async function dispatchExternalDeviceTrigger(webhookUrl: string | null | undefined, eventData: ExternalTriggerEvent) {
  if (!webhookUrl) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform-Event': eventData.event,
      },
      body: JSON.stringify(eventData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('[ExternalTrigger] Failed to notify external device webhook:', webhookUrl, err);
  }
}
