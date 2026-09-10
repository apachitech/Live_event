'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Room, RoomEvent, RemoteTrack } from 'livekit-client';
import { io, Socket } from 'socket.io-client';
import Hls from 'hls.js';
import { Volume2, VolumeX, Maximize, Radio, Users, Sparkles, Wifi, Play, Globe, Camera, CameraOff } from 'lucide-react';

interface VideoPlayerProps {
  streamId: string;
  streamTitle: string;
  streamerName: string;
  viewerCount: number;
  isPrivate?: boolean;
  sourceType?: string;
  externalStreamUrl?: string | null;
  c2cEnabled?: boolean;
}

export default function VideoPlayer({
  streamId,
  streamTitle,
  streamerName,
  viewerCount,
  isPrivate = false,
  sourceType = 'WEBRTC',
  externalStreamUrl = null,
  c2cEnabled = true,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userCamRef = useRef<HTMLVideoElement>(null);

  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentSourceType, setCurrentSourceType] = useState(sourceType);
  const [currentExternalUrl, setCurrentExternalUrl] = useState(externalStreamUrl);
  const [connectionType, setConnectionType] = useState<
    'LIVEKIT_WEBRTC' | 'CLOUDINARY_EMBED' | 'HLS_STREAM' | 'DIRECT_INGEST'
  >('DIRECT_INGEST');

  // C2C (Cam-to-Cam) Viewer state
  const [userCamActive, setUserCamActive] = useState(false);
  const [userMicActive, setUserMicActive] = useState(false);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);

  // Sync props when stream data updates
  useEffect(() => {
    if (sourceType) setCurrentSourceType(sourceType);
    if (externalStreamUrl !== undefined) setCurrentExternalUrl(externalStreamUrl);
  }, [sourceType, externalStreamUrl]);

  // Listen for real-time stream source change via socket
  useEffect(() => {
    const socket: Socket = io();
    socket.emit('join_room', {
      streamId,
      user: { id: 'viewer_player', username: 'Viewer', role: 'VIEWER' },
    });

    socket.on('stream_source_changed', (payload: any) => {
      if (payload.streamId === streamId) {
        setCurrentSourceType(payload.sourceType);
        setCurrentExternalUrl(payload.externalStreamUrl);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [streamId]);

  // 1. Play Cloudinary or External HLS Stream if active
  useEffect(() => {
    if (currentSourceType === 'EXTERNAL_EMBED' && currentExternalUrl) {
      const video = videoElementRef.current;
      if (!video) return;

      let hlsInstance: Hls | null = null;
      const isHls = currentExternalUrl.includes('.m3u8');

      if (isHls && Hls.isSupported()) {
        setConnectionType('HLS_STREAM');
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hlsInstance.loadSource(currentExternalUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setHasRemoteVideo(true);
        });

        hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn('HLS Fatal Error:', data.details);
          }
        });
      } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Apple Safari HLS playback
        setConnectionType('HLS_STREAM');
        video.src = currentExternalUrl;
        video.play().catch(() => {});
        setHasRemoteVideo(true);
      } else {
        // Direct MP4 / Cloudinary video URL playback
        setConnectionType('CLOUDINARY_EMBED');
        video.src = currentExternalUrl;
        video.loop = true;
        video.play().catch(() => {});
        setHasRemoteVideo(true);
      }

      return () => {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        setHasRemoteVideo(false);
      };
    }
  }, [currentSourceType, currentExternalUrl]);

  // 2. Connect to LiveKit WebRTC Room if source is WEBRTC
  useEffect(() => {
    if (currentSourceType === 'EXTERNAL_EMBED') return;

    let room: Room | null = null;

    async function initLiveKitSubscriber() {
      try {
        const res = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId }),
        });

        const data = await res.json();
        if (!data.success || !data.credentials) return;

        const { serverUrl, participantToken } = data.credentials;

        if (serverUrl && (serverUrl.startsWith('wss://') || serverUrl.startsWith('ws://'))) {
          setConnectionType('LIVEKIT_WEBRTC');
          room = new Room({
            adaptiveStream: true,
            dynacast: true,
          });

          room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
            if (track.kind === 'video' && videoElementRef.current) {
              track.attach(videoElementRef.current);
              setHasRemoteVideo(true);
            }
            if (track.kind === 'audio' && audioElementRef.current) {
              track.attach(audioElementRef.current);
            }
          });

          room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            if (track.kind === 'video') {
              track.detach();
              setHasRemoteVideo(false);
            }
            if (track.kind === 'audio') {
              track.detach();
            }
          });

          await room.connect(serverUrl, participantToken);
          setLivekitRoom(room);
        } else {
          setConnectionType('DIRECT_INGEST');
        }
      } catch (err: any) {
        console.warn('LiveKit subscriber notice:', err.message);
        setConnectionType('DIRECT_INGEST');
      }
    }

    initLiveKitSubscriber();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [streamId, currentSourceType]);

  // Volume & Mute listener
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = muted;
      audioElementRef.current.volume = volume;
    }
    if (videoElementRef.current) {
      videoElementRef.current.muted = muted;
      videoElementRef.current.volume = volume;
    }
  }, [muted, volume]);

  // 2. Render high-fidelity cyber visualizer on canvas when remote video is not yet streaming
  useEffect(() => {
    if (hasRemoteVideo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#090a12');
      bgGrad.addColorStop(0.5, '#120f24');
      bgGrad.addColorStop(1, '#08080c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Dynamic spectrum bars
      const bars = 48;
      const barWidth = width / bars;
      for (let i = 0; i < bars; i++) {
        const freq = Math.sin(tick + i * 0.25) * Math.cos(tick * 0.7 + i * 0.1);
        const barHeight = Math.abs(freq) * (height * 0.35) + 20;
        const x = i * barWidth;
        const y = height / 2 - barHeight / 2;

        const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGrad.addColorStop(0, '#ec4899');
        barGrad.addColorStop(0.5, '#8b5cf6');
        barGrad.addColorStop(1, '#f59e0b');

        ctx.fillStyle = barGrad;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      }

      // Center Streamer Avatar Glow
      const cx = width / 2;
      const cy = height / 2;
      const pulseSize = 48 + Math.sin(tick * 2) * 4;

      const avatarGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, pulseSize + 25);
      avatarGlow.addColorStop(0, isPrivate ? 'rgba(236, 72, 153, 0.8)' : 'rgba(139, 92, 246, 0.8)');
      avatarGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = avatarGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize + 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1c1d27';
      ctx.beginPath();
      ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isPrivate ? '#ec4899' : '#8b5cf6';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(streamerName ? streamerName.substring(0, 2).toUpperCase() : 'LIVE', cx, cy);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [streamerName, isPrivate, hasRemoteVideo]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  // C2C Toggle camera
  const toggleUserCam = async () => {
    if (userCamActive) {
      if (userStream) {
        userStream.getTracks().forEach((t) => t.stop());
      }
      setUserStream(null);
      setUserCamActive(false);
      setUserMicActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });
        setUserStream(stream);
        setUserCamActive(true);
        setUserMicActive(true);
        if (userCamRef.current) {
          userCamRef.current.srcObject = stream;
        }
      } catch (err: any) {
        alert('Could not access your camera/microphone for C2C: ' + err.message);
      }
    }
  };

  // Sync userCamRef whenever stream attaches
  useEffect(() => {
    if (userCamRef.current && userStream) {
      userCamRef.current.srcObject = userStream;
    }
  }, [userStream, userCamActive]);

  // Cleanup user camera stream on unmount or private exit
  useEffect(() => {
    return () => {
      if (userStream) {
        userStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [userStream]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl bg-black border border-surfaceBorder overflow-hidden shadow-2xl flex items-center justify-center group"
    >
      {/* Remote WebRTC Video Surface */}
      <video
        ref={videoElementRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasRemoteVideo ? 'block' : 'hidden'}`}
      />
      <audio ref={audioElementRef} autoPlay />

      {/* Fallback Animated Visualizer */}
      {!hasRemoteVideo && (
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full object-cover"
        />
      )}

      {/* Cam-to-Cam (C2C) Picture-in-Picture Viewer Cam */}
      {isPrivate && c2cEnabled && (
        <div className="absolute bottom-16 right-4 z-30 w-44 sm:w-56 aspect-video rounded-xl bg-surface/90 backdrop-blur-md border-2 border-pink-500/80 shadow-2xl overflow-hidden flex flex-col items-center justify-center group/pip transition-all">
          {userCamActive ? (
            <video
              ref={userCamRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center">
              <CameraOff className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-[10px] text-gray-300 font-bold">Your Cam is Off</span>
            </div>
          )}

          {/* C2C PiP Control Bar */}
          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-pink-400 px-1">
              {userCamActive ? 'C2C LIVE' : 'C2C STANDBY'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleUserCam}
                className={`p-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                  userCamActive
                    ? 'bg-red-600/90 text-white hover:bg-red-700'
                    : 'bg-pink-600/90 text-white hover:bg-pink-700'
                }`}
                title={userCamActive ? 'Turn Off My Cam' : 'Broadcast My Cam'}
              >
                {userCamActive ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                <span className="text-[9px]">{userCamActive ? 'Stop' : 'Start Cam'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Overlay Badges */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-red-600/40">
            <Radio className="w-3 h-3 animate-ping" />
            <span>{isPrivate ? 'PRIVATE SHOW (1:1)' : 'LIVE'}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
            <Users className="w-3.5 h-3.5 text-brandPurple" />
            <span>{viewerCount} Viewers</span>
          </div>
        </div>

        <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-gray-300 border border-white/10 flex items-center gap-1.5">
          {connectionType === 'CLOUDINARY_EMBED' ? (
            <>
              <Globe className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-cyan-300">Cloudinary Live Stream</span>
            </>
          ) : connectionType === 'HLS_STREAM' ? (
            <>
              <Globe className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span className="text-indigo-300">HLS Adaptive Stream</span>
            </>
          ) : connectionType === 'LIVEKIT_WEBRTC' ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>LiveKit Cloud WebRTC</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-gray-400" />
              <span>Direct Broadcast Feed</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar (Visible on Hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <div className="text-xs text-white font-bold truncate max-w-sm">
          {streamTitle}
        </div>

        <div className="flex items-center gap-3">
          {/* Volume control */}
          <div className="flex items-center gap-1.5 bg-surfaceLight/80 px-2 py-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setMuted(!muted)}
              className="text-white hover:text-gray-300 transition"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setMuted(false);
              }}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brandPurple"
            />
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-surfaceLight/80 hover:bg-surfaceLight text-white transition border border-white/10"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
