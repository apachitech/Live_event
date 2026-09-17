'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Room, RoomEvent, RemoteTrack } from 'livekit-client';
import { io, Socket } from 'socket.io-client';
import Hls from 'hls.js';
import { Volume2, VolumeX, Maximize, Maximize2, Radio, Users, Sparkles, Wifi, Play, Globe, Camera, CameraOff, Smartphone, Laptop } from 'lucide-react';

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
  const [muted, setMuted] = useState(true);
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

  // Responsive device metrics & viewport sizing
  const [windowDimensions, setWindowDimensions] = useState({ width: 1280, height: 720 });
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [aspectMode, setAspectMode] = useState<'AUTO' | '16:9' | '9:16' | '4:3'>('AUTO');
  const [videoFit, setVideoFit] = useState<'cover' | 'contain'>('contain');
  const [showControlsMobile, setShowControlsMobile] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWindowDimensions({ width: w, height: h });
      const mobile = w <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobileDevice(mobile);
      setIsPortrait(h > w);
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    window.addEventListener('orientationchange', updateMetrics);
    return () => {
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('orientationchange', updateMetrics);
    };
  }, []);

  const getContainerAspectClass = () => {
    if (aspectMode === 'AUTO') {
      if (isMobileDevice && isPortrait) {
        return 'aspect-[9/16] w-full max-w-[400px] max-h-[72vh] mx-auto min-h-[350px] shadow-2xl';
      }
      return 'aspect-video w-full max-h-[55vh] sm:max-h-[58vh] lg:max-h-[64vh] min-h-[220px] sm:min-h-[320px]';
    }
    if (aspectMode === '9:16') {
      return 'aspect-[9/16] w-full max-w-[400px] max-h-[72vh] mx-auto min-h-[350px] shadow-2xl';
    }
    if (aspectMode === '4:3') {
      return 'aspect-[4/3] w-full max-w-[680px] max-h-[60vh] mx-auto min-h-[260px]';
    }
    return 'aspect-video w-full max-h-[55vh] sm:max-h-[58vh] lg:max-h-[64vh] min-h-[220px] sm:min-h-[320px]';
  };

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

  // Resolved video URL for direct ingest / fallback playback
  const resolvedVideoUrl =
    currentExternalUrl ||
    externalStreamUrl ||
    'https://res.cloudinary.com/demo/video/upload/sample.mp4';

  // Unified Stream Playback Engine (LiveKit WebRTC + HLS + MP4 Direct Ingest Fallback)
  useEffect(() => {
    let room: Room | null = null;
    let hlsInstance: Hls | null = null;
    let isCancelled = false;

    const video = videoElementRef.current;
    if (!video) return;

    const playDirectMedia = (url: string) => {
      const isHls = url.includes('.m3u8');
      if (isHls && Hls.isSupported()) {
        setConnectionType('HLS_STREAM');
        if (hlsInstance) hlsInstance.destroy();
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setHasRemoteVideo(true);
        });

        hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn('HLS stream notice:', data.details);
          }
        });
      } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        setConnectionType('HLS_STREAM');
        video.src = url;
        video.play().catch(() => {});
        setHasRemoteVideo(true);
      } else {
        setConnectionType(
          currentSourceType === 'EXTERNAL_EMBED' ? 'CLOUDINARY_EMBED' : 'DIRECT_INGEST'
        );
        if (video.src !== url) {
          video.src = url;
        }
        video.loop = true;
        video.play().catch(() => {});
        setHasRemoteVideo(true);
      }
    };

    // Immediately start media playback from frame 0
    playDirectMedia(resolvedVideoUrl);

    // Concurrently attempt LiveKit cloud connection for WebRTC
    if (currentSourceType === 'WEBRTC') {
      fetch('/api/stream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (isCancelled) return;
          const { serverUrl, participantToken } = data?.credentials || {};
          if (serverUrl && (serverUrl.startsWith('wss://') || serverUrl.startsWith('ws://'))) {
            setConnectionType('LIVEKIT_WEBRTC');
            room = new Room({ adaptiveStream: true, dynacast: true });
            room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
              if (track.kind === 'video' && videoElementRef.current) {
                track.attach(videoElementRef.current);
                setHasRemoteVideo(true);
              }
              if (track.kind === 'audio' && audioElementRef.current) {
                track.attach(audioElementRef.current);
              }
            });
            await room.connect(serverUrl, participantToken);
            if (!isCancelled) {
              setLivekitRoom(room);
            } else {
              room.disconnect();
            }
          }
        })
        .catch((err) => {
          console.warn('LiveKit subscriber notice:', err);
        });
    }

    return () => {
      isCancelled = true;
      if (room) {
        room.disconnect();
      }
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [streamId, currentSourceType, resolvedVideoUrl]);

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
      userCamRef.current.play().catch(() => {});
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
    <div className="space-y-2">
      {/* Video Viewport Container (Device Proportional) */}
      <div
        ref={containerRef}
        onClick={() => {
          if (muted) {
            setMuted(false);
          }
          setShowControlsMobile(!showControlsMobile);
        }}
        className={`relative rounded-2xl bg-black border border-surfaceBorder overflow-hidden shadow-2xl flex items-center justify-center group transition-all duration-300 ${getContainerAspectClass()}`}
      >
        {/* Video Surface */}
        <video
          ref={videoElementRef}
          src={resolvedVideoUrl}
          autoPlay
          playsInline
          muted={muted}
          loop
          onPlaying={() => setHasRemoteVideo(true)}
          onLoadedData={() => setHasRemoteVideo(true)}
          onCanPlay={() => setHasRemoteVideo(true)}
          className={`absolute inset-0 w-full h-full ${
            videoFit === 'cover' ? 'object-cover' : 'object-contain'
          } z-10`}
        />
        <audio ref={audioElementRef} autoPlay />

        {/* Floating Tap to Unmute Banner */}
        {muted && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMuted(false);
            }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-2xl flex items-center gap-1.5 transition hover:scale-105 pointer-events-auto"
          >
            <VolumeX className="w-3.5 h-3.5 text-pink-400" />
            <span>Tap to Unmute</span>
          </button>
        )}

        {/* Fallback Animated Visualizer */}
        {!hasRemoteVideo && (
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className={`absolute inset-0 w-full h-full ${
              videoFit === 'cover' ? 'object-cover' : 'object-contain'
            } z-0`}
          />
        )}

        {/* Cam-to-Cam (C2C) Picture-in-Picture Viewer Cam */}
        {isPrivate && c2cEnabled && (
          <div className="absolute bottom-16 right-3 sm:right-4 z-30 w-36 sm:w-52 aspect-video rounded-xl bg-surface/90 backdrop-blur-md border-2 border-pink-500/80 shadow-2xl overflow-hidden flex flex-col items-center justify-center group/pip transition-all">
            {userCamActive ? (
              <video
                ref={userCamRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <CameraOff className="w-5 h-5 text-gray-400 mb-0.5" />
                <span className="text-[9px] text-gray-300 font-bold">Your Cam is Off</span>
              </div>
            )}

            {/* C2C PiP Control Bar */}
            <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-wider text-pink-400 px-1">
                {userCamActive ? 'C2C LIVE' : 'STANDBY'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUserCam();
                  }}
                  className={`p-1 rounded-md text-[9px] font-bold transition flex items-center gap-1 ${
                    userCamActive
                      ? 'bg-red-600/90 text-white hover:bg-red-700'
                      : 'bg-pink-600/90 text-white hover:bg-pink-700'
                  }`}
                  title={userCamActive ? 'Turn Off My Cam' : 'Broadcast My Cam'}
                >
                  {userCamActive ? <CameraOff className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
                  <span className="text-[8px]">{userCamActive ? 'Stop' : 'Start'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Overlay Badges - Horizontally scrollable on small screens */}
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 flex items-center justify-between gap-2 pointer-events-none z-20">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-nowrap touch-pan-x pointer-events-auto max-w-[70%] sm:max-w-none">
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-red-600/90 text-white text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-lg shadow-red-600/40">
              <Radio className="w-3 h-3 animate-ping" />
              <span>{isPrivate ? 'PRIVATE SHOW (1:1)' : 'LIVE'}</span>
            </div>

            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold border border-white/10">
              <Users className="w-3.5 h-3.5 text-brandPurple" />
              <span>{viewerCount} Viewers</span>
            </div>

            {/* Device & Aspect Ratio Badge */}
            <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-gray-300">
              {aspectMode === 'AUTO' ? (
                isMobileDevice && isPortrait ? <Smartphone className="w-3 h-3 text-cyan-400" /> : <Laptop className="w-3 h-3 text-amber-400" />
              ) : aspectMode === '9:16' ? (
                <Smartphone className="w-3 h-3 text-cyan-400" />
              ) : (
                <Laptop className="w-3 h-3 text-amber-400" />
              )}
              <span className="font-semibold">
                {aspectMode === 'AUTO' ? (isMobileDevice && isPortrait ? 'Phone 9:16' : 'Laptop 16:9') : aspectMode}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-gray-300 border border-white/10 flex items-center gap-1.5">
            {connectionType === 'CLOUDINARY_EMBED' ? (
              <>
                <Globe className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 hidden sm:inline">Cloudinary Stream</span>
                <span className="text-cyan-300 sm:hidden">Cloudinary</span>
              </>
            ) : connectionType === 'HLS_STREAM' ? (
              <>
                <Globe className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-indigo-300 hidden sm:inline">HLS Adaptive</span>
                <span className="text-indigo-300 sm:hidden">HLS</span>
              </>
            ) : connectionType === 'LIVEKIT_WEBRTC' ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">LiveKit WebRTC</span>
                <span className="sm:hidden">WebRTC</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-gray-400" />
                <span className="hidden sm:inline">Direct Feed</span>
                <span className="sm:hidden">Feed</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Controls Bar (Visible on Hover or Touch) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between gap-3 transition-opacity duration-200 z-20 ${
            showControlsMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
          }`}
        >
          <div className="text-xs text-white font-bold truncate max-w-[140px] sm:max-w-xs shrink-0">
            {streamTitle}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 flex-nowrap touch-pan-x">
            {/* Volume control */}
            <div className="shrink-0 flex items-center gap-1.5 bg-surfaceLight/80 px-2 py-1.5 rounded-xl border border-white/10">
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
                className="w-14 sm:w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brandPurple"
              />
            </div>

            {/* Quick Sizing & Aspect Switcher inside player */}
            <div className="shrink-0 flex items-center p-0.5 rounded-xl bg-surfaceLight/80 border border-white/10 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setAspectMode('AUTO')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                  aspectMode === 'AUTO' ? 'bg-brandPurple text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Auto Proportional to Device"
              >
                {isMobileDevice && isPortrait ? <Smartphone className="w-3 h-3 text-cyan-400" /> : <Laptop className="w-3 h-3 text-amber-400" />}
                <span className="hidden sm:inline">Auto</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectMode('16:9')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                  aspectMode === '16:9' ? 'bg-brandPurple text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Laptop 16:9"
              >
                <Laptop className="w-3 h-3" />
                <span className="hidden sm:inline">16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectMode('9:16')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                  aspectMode === '9:16' ? 'bg-brandPurple text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Phone 9:16"
              >
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">9:16</span>
              </button>
            </div>

            {/* Fit / Fill Toggle */}
            <button
              type="button"
              onClick={() => setVideoFit(videoFit === 'cover' ? 'contain' : 'cover')}
              className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 ${
                videoFit === 'cover'
                  ? 'bg-surfaceLight/80 border-white/10 text-gray-200 hover:text-white'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              }`}
              title="Toggle between Full Frame (Fit) and Edge-to-Edge (Fill)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{videoFit === 'cover' ? 'Fill' : 'Fit'}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="shrink-0 p-2 rounded-xl bg-surfaceLight/80 hover:bg-surfaceLight text-white transition border border-white/10"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Viewer Sizing & Screen Mode Ribbon (Always accessible & left-right scrollable on phones/laptops) */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl glass-panel border border-surfaceBorder text-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-nowrap touch-pan-x">
          <span className="text-gray-400 font-bold shrink-0">Screen Size:</span>

          <button
            type="button"
            onClick={() => setAspectMode('AUTO')}
            className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition font-semibold ${
              aspectMode === 'AUTO'
                ? 'bg-brandPurple text-white shadow'
                : 'bg-surfaceLight text-gray-300 hover:text-white border border-surfaceBorder'
            }`}
          >
            {isMobileDevice && isPortrait ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Laptop className="w-3.5 h-3.5 text-amber-400" />}
            <span>Auto ({isMobileDevice && isPortrait ? 'Phone' : 'Laptop'})</span>
          </button>

          <button
            type="button"
            onClick={() => setAspectMode('16:9')}
            className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition font-semibold ${
              aspectMode === '16:9'
                ? 'bg-brandPurple text-white shadow'
                : 'bg-surfaceLight text-gray-300 hover:text-white border border-surfaceBorder'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>16:9 (Laptop)</span>
          </button>

          <button
            type="button"
            onClick={() => setAspectMode('9:16')}
            className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition font-semibold ${
              aspectMode === '9:16'
                ? 'bg-brandPurple text-white shadow'
                : 'bg-surfaceLight text-gray-300 hover:text-white border border-surfaceBorder'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 (Phone)</span>
          </button>

          <button
            type="button"
            onClick={() => setVideoFit(videoFit === 'cover' ? 'contain' : 'cover')}
            className={`shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition font-semibold border ${
              videoFit === 'cover'
                ? 'bg-surfaceLight text-gray-200 border-surfaceBorder hover:text-white'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{videoFit === 'cover' ? 'Mode: Fill' : 'Mode: Fit'}</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-gray-400 shrink-0 font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Device Sync Active</span>
        </div>
      </div>
    </div>
  );
}
