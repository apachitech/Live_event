import { LiveVideoProvider, StreamCredentials } from './interface';

export class MockVideoProvider implements LiveVideoProvider {
  name = 'MockVideoProvider';

  async createStreamRoom(streamId: string, _title: string): Promise<{ roomName: string; playbackUrl?: string }> {
    const roomName = `mock_room_${streamId}_${Date.now()}`;
    return {
      roomName,
      playbackUrl: `/api/stream/mock-playback/${streamId}`,
    };
  }

  async generatePublisherToken(roomName: string, streamerUserId: string, displayName: string): Promise<StreamCredentials> {
    return {
      roomName,
      participantToken: `mock_pub_token_${streamerUserId}_${Date.now()}`,
      serverUrl: 'mock://local-broadcast',
      isPublisher: true,
    };
  }

  async generateViewerToken(roomName: string, viewerUserId: string, displayName: string): Promise<StreamCredentials> {
    return {
      roomName,
      participantToken: `mock_sub_token_${viewerUserId}_${Date.now()}`,
      serverUrl: 'mock://local-broadcast',
      isPublisher: false,
    };
  }

  async endStreamRoom(_roomName: string): Promise<boolean> {
    return true;
  }
}
