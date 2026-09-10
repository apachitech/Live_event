import { AccessToken } from 'livekit-server-sdk';
import { LiveVideoProvider, StreamCredentials } from './interface';

export class LiveKitVideoProvider implements LiveVideoProvider {
  name = 'LiveKit';
  private apiKey: string;
  private apiSecret: string;
  private wsUrl: string;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || '';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || '';
    this.wsUrl = process.env.LIVEKIT_URL || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiSecret && this.wsUrl);
  }

  async createStreamRoom(streamId: string, _title: string): Promise<{ roomName: string; playbackUrl?: string }> {
    const roomName = `room_${streamId}`;
    return { roomName, playbackUrl: `${this.wsUrl}/${roomName}` };
  }

  async generatePublisherToken(roomName: string, streamerUserId: string, displayName: string): Promise<StreamCredentials> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: streamerUserId,
      name: displayName,
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    const token = await at.toJwt();
    return {
      roomName,
      participantToken: token,
      serverUrl: this.wsUrl,
      isPublisher: true,
    };
  }

  async generateViewerToken(roomName: string, viewerUserId: string, displayName: string): Promise<StreamCredentials> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: viewerUserId,
      name: displayName,
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: false,
      canSubscribe: true,
    });
    const token = await at.toJwt();
    return {
      roomName,
      participantToken: token,
      serverUrl: this.wsUrl,
      isPublisher: false,
    };
  }

  async endStreamRoom(_roomName: string): Promise<boolean> {
    return true;
  }
}
