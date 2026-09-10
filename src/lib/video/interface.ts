export interface StreamCredentials {
  roomName: string;
  participantToken: string;
  serverUrl: string;
  isPublisher: boolean;
}

export interface LiveVideoProvider {
  name: string;
  createStreamRoom(streamId: string, title: string): Promise<{ roomName: string; playbackUrl?: string }>;
  generatePublisherToken(roomName: string, streamerUserId: string, displayName: string): Promise<StreamCredentials>;
  generateViewerToken(roomName: string, viewerUserId: string, displayName: string): Promise<StreamCredentials>;
  endStreamRoom(roomName: string): Promise<boolean>;
}
