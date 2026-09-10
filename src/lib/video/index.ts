import { LiveVideoProvider } from './interface';
import { LiveKitVideoProvider } from './livekitAdapter';
import { MockVideoProvider } from './mockVideoAdapter';

const liveKit = new LiveKitVideoProvider();

export const videoProvider: LiveVideoProvider = liveKit.isConfigured()
  ? liveKit
  : new MockVideoProvider();

export * from './interface';
