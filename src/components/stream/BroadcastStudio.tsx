'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Room, createLocalTracks } from 'livekit-client';
import Hls from 'hls.js';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Copy,
  Check,
  Key,
  Volume2,
  Sparkles,
  Globe,
  Play,
  Square,
  Zap,
  Monitor,
  MonitorOff,
  Sliders,
  Share2,
  Activity,
  Eye,
  EyeOff,
  Music,
  Smartphone,
  Laptop,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import ToyPairingModal from './ToyPairingModal';
import { soundEffects } from '@/lib/sound/soundEffects';

interface BroadcastStudioProps {
  streamId: string | null;
  isLive: boolean;
  isActionLoading?: boolean;
  onStartStream?: () => void;
  onEndStream?: () => void;
  onLiveKitStatusChange?: (status: string) => void;
}

type VideoFilter = 'normal' | 'vibrant' | 'cyberpunk' | 'noir';

export default function BroadcastStudio({
  streamId,
  isLive,
  isActionLoading = false,
  onStartStream,
  onEndStream,
}: BroadcastStudioProps) {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const screenPreviewRef = useRef<HTMLVideoElement>(null);
  const externalPreviewRef = useRef<HTMLVideoElement>(null);
  const audioMeterCanvasRef = useRef<HTMLCanvasElement>(null);

  // Broadcast source mode
  const [sourceMode, setSourceMode] = useState<'WEBRTC' | 'RTMP' | 'EXTERNAL_EMBED'>('WEBRTC');
  const [externalUrl, setExternalUrl] = useState('');
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [sourceSaveSuccess, setSourceSaveSuccess] = useState(false);

  // Hardware devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  // Track & Permission states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Screen Share state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Video Enhancements (Mirroring & Filters)
  const [isMirrored, setIsMirrored] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter>('normal');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // LiveKit WebRTC state
  const livekitRoomRef = useRef<Room | null>(null);
  const [livekitConnected, setLivekitConnected] = useState(false);
  const [livekitMessage, setLivekitMessage] = useState<string>('');

  // Live Broadcast Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // OBS Ingress credentials
  const [showObsDrawer, setShowObsDrawer] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [ingressData, setIngressData] = useState<{ rtmpServer: string; streamKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);

  // Interactive Toy Modal
  const [showToyModal, setShowToyModal] = useState(false);

  // Soundboard panel
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [activeSfx, setActiveSfx] = useState<string | null>(null);

  // Screen Proportions & Device Adaptation
  const [aspectMode, setAspectMode] = useState<'AUTO' | '16:9' | '9:16' | '4:3'>('AUTO');
  const [videoFit, setVideoFit] = useState<'cover' | 'contain'>('cover');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // Track window resizing and device orientation changes
  useEffect(() => {
    const updateDeviceMetrics = () => {
      const mobile = window.innerWidth < 768;
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobileDevice(mobile);
      setIsPortrait(portrait);
    };
    updateDeviceMetrics();
    window.addEventListener('resize', updateDeviceMetrics);
    window.addEventListener('orientationchange', updateDeviceMetrics);
    return () => {
      window.removeEventListener('resize', updateDeviceMetrics);
      window.removeEventListener('orientationchange', updateDeviceMetrics);
    };
  }, []);

  // Compute proportional aspect ratio class based on laptop vs phone
  const getContainerAspectClass = () => {
    if (aspectMode === '16:9') {
      return 'aspect-video w-full max-h-[58vh] sm:max-h-[62vh] min-h-[200px] sm:min-h-[300px]';
    }
    if (aspectMode === '9:16') {
      return 'aspect-[9/16] w-full max-w-[360px] sm:max-w-[400px] max-h-[72vh] mx-auto min-h-[340px] shadow-2xl';
    }
    if (aspectMode === '4:3') {
      return 'aspect-[4/3] w-full max-w-[620px] max-h-[60vh] mx-auto min-h-[220px] sm:min-h-[280px]';
    }

    // 'AUTO' mode: adapts to phone vs laptop
    if (isMobileDevice && isPortrait) {
      // Mobile portrait orientation: stream vertically like native mobile camera
      return 'aspect-[9/16] w-full max-w-[380px] max-h-[70vh] mx-auto min-h-[340px] shadow-2xl';
    }
    // Laptop / Desktop / Landscape tablet: proportional widescreen
    return 'aspect-video w-full max-h-[55vh] sm:max-h-[58vh] lg:max-h-[64vh] min-h-[200px] sm:min-h-[300px]';
  };

  // 1. Enumerate media devices
  useEffect(() => {
    async function loadDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) {
          setPermissionError('Media devices API not supported in this browser.');
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devices.filter((d) => d.kind === 'videoinput');
        const aDevs = devices.filter((d) => d.kind === 'audioinput');

        setVideoDevices(vDevs);
        setAudioDevices(aDevs);

        if (vDevs.length > 0 && !selectedVideoDeviceId) {
          setSelectedVideoDeviceId(vDevs[0].deviceId);
        }
        if (aDevs.length > 0 && !selectedAudioDeviceId) {
          setSelectedAudioDeviceId(aDevs[0].deviceId);
        }
      } catch (err: any) {
        console.warn('Error enumerating devices:', err);
      }
    }

    loadDevices();
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  // 2. Camera & Mic Preview Engine
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let animFrame: number;

    async function startPreview() {
      try {
        setPermissionError(null);

        const constraints: MediaStreamConstraints = {
          video: selectedVideoDeviceId
            ? { deviceId: { exact: selectedVideoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: selectedAudioDeviceId
            ? { deviceId: { exact: selectedAudioDeviceId } }
            : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        setMediaStream(stream);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // VU Meter with Web Audio API
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
          if (audioContext.state === 'suspended') {
            await audioContext.resume().catch(() => {});
          }

          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const canvas = audioMeterCanvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const drawVU = () => {
                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / bufferLength;
                const levelPercent = Math.min(100, Math.round((avg / 128) * 100));

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#181926';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
                grad.addColorStop(0, '#10b981');
                grad.addColorStop(0.7, '#f59e0b');
                grad.addColorStop(1, '#ef4444');
                ctx.fillStyle = grad;

                const fillWidth = (levelPercent / 100) * canvas.width;
                ctx.fillRect(0, 0, fillWidth, canvas.height);

                animFrame = requestAnimationFrame(drawVU);
              };

              drawVU();
            }
          }
        }
      } catch (err: any) {
        console.warn('Camera/Mic access note:', err.message);
        setPermissionError('Camera or Microphone not available. Studio is in standby.');
      }
    }

    startPreview();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
      cancelAnimationFrame(animFrame);
    };
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  // Dedicated Video Preview Synchronization Effect
  useEffect(() => {
    const video = videoPreviewRef.current;
    if (video && mediaStream && isVideoEnabled) {
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      video.play().catch(() => {});
    }
  }, [mediaStream, isVideoEnabled, sourceMode, isScreenSharing]);

  // Dedicated External Stream Embed Preview Synchronization Effect
  useEffect(() => {
    const video = externalPreviewRef.current;
    if (!video || !externalUrl || sourceMode !== 'EXTERNAL_EMBED') return;

    let hls: Hls | null = null;
    const isHls = externalUrl.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(externalUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = externalUrl;
      video.play().catch(() => {});
    } else {
      if (video.src !== externalUrl) {
        video.src = externalUrl;
      }
      video.loop = true;
      video.play().catch(() => {});
    }

    return () => {
      if (hls) hls.destroy();
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [externalUrl, sourceMode]);

  // Simulated Studio Test Video Pattern (for standby testing without hardware camera)
  const startSimulatedCamera = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let frame = 0;
      const drawFrame = () => {
        frame++;
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#2e1065');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const r = 120 + Math.sin(frame * 0.05) * 25;
        ctx.arc(640, 340, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(640, 340, r + 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LIVE BROADCAST STUDIO TEST FEED', 640, 330);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '18px sans-serif';
        ctx.fillText(`Active Test Pattern • Frame ${frame} • 1080p 60fps`, 640, 380);

        requestAnimationFrame(drawFrame);
      };
      drawFrame();

      const simStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (simStream) {
        setMediaStream(simStream);
        setPermissionError(null);
        setIsVideoEnabled(true);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = simStream;
          videoPreviewRef.current.play().catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn('Could not start simulated camera:', e);
    }
  };

  // Live broadcast stopwatch timer
  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen sharing is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true,
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      if (screenPreviewRef.current) {
        screenPreviewRef.current.srcObject = stream;
      }

      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
      };
    } catch (err: any) {
      console.warn('Screen share canceled or denied:', err.message);
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => {
        t.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Connect to LiveKit when stream is LIVE
  useEffect(() => {
    if (!isLive || !streamId) {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
        setLivekitConnected(false);
      }
      return;
    }

    async function connectLiveKitPublisher() {
      try {
        const tokenRes = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId }),
        });

        const data = await tokenRes.json();
        if (!data.success || !data.credentials) return;

        const { serverUrl, participantToken } = data.credentials;

        if (serverUrl && (serverUrl.startsWith('wss://') || serverUrl.startsWith('ws://'))) {
          setLivekitMessage('Connecting LiveKit WebRTC...');
          const room = new Room({ adaptiveStream: true, dynacast: true });
          livekitRoomRef.current = room;

          await room.connect(serverUrl, participantToken);
          setLivekitConnected(true);
          setLivekitMessage('Connected to LiveKit Cloud Ingest');

          if (mediaStream) {
            const tracks = await createLocalTracks({
              audio: true,
              video: { resolution: { width: 1280, height: 720 } },
            });

            for (const track of tracks) {
              await room.localParticipant.publishTrack(track);
            }
          }
        } else {
          setLivekitConnected(false);
          setLivekitMessage('Active in High-Performance Stream Relay Mode');
        }
      } catch (err: any) {
        console.warn('LiveKit publisher notice:', err.message);
        setLivekitConnected(false);
        setLivekitMessage('LiveKit server not connected; using local relay');
      }
    }

    connectLiveKitPublisher();

    return () => {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
    };
  }, [isLive, streamId, mediaStream]);

  // Load existing stream source settings
  useEffect(() => {
    if (!streamId) return;
    fetch(`/api/stream/${streamId}/source`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stream) {
          if (data.stream.sourceType) setSourceMode(data.stream.sourceType as any);
          if (data.stream.externalStreamUrl) setExternalUrl(data.stream.externalStreamUrl);
        }
      })
      .catch(() => {});
  }, [streamId]);

  // External stream HLS preview
  useEffect(() => {
    if (sourceMode === 'EXTERNAL_EMBED' && externalUrl) {
      const video = externalPreviewRef.current;
      if (!video) return;

      let hls: Hls | null = null;
      if (externalUrl.includes('.m3u8') && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(externalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else {
        video.src = externalUrl;
        video.loop = true;
        video.play().catch(() => {});
      }

      return () => {
        if (hls) hls.destroy();
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
      };
    }
  }, [sourceMode, externalUrl]);

  const handleSaveSource = async (mode: 'WEBRTC' | 'RTMP' | 'EXTERNAL_EMBED', url?: string) => {
    if (!streamId) return;
    setIsSavingSource(true);
    try {
      const res = await fetch(`/api/stream/${streamId}/source`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: mode,
          externalStreamUrl: url || (mode === 'EXTERNAL_EMBED' ? externalUrl : null),
        }),
      });
      if (res.ok) {
        setSourceMode(mode);
        setSourceSaveSuccess(true);
        setTimeout(() => setSourceSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingSource(false);
    }
  };

  const fetchIngress = async () => {
    if (!streamId) return;
    try {
      const res = await fetch(`/api/stream/${streamId}/ingress`);
      const data = await res.json();
      if (data.ingress) {
        setIngressData(data.ingress);
        setShowObsDrawer(true);
      }
    } catch (e: any) {
      alert('Could not fetch ingress: ' + e.message);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'url' | 'room') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedRoomLink(true);
      setTimeout(() => setCopiedRoomLink(false), 2000);
    }
  };

  const playSfx = (sfxType: 'coin' | 'airhorn' | 'victory' | 'bass') => {
    setActiveSfx(sfxType);
    if (sfxType === 'coin') soundEffects.playCoinChime();
    if (sfxType === 'airhorn') soundEffects.playAirhorn();
    if (sfxType === 'victory') soundEffects.playVictoryFanfare();
    if (sfxType === 'bass') soundEffects.playBassDrop();
    setTimeout(() => setActiveSfx(null), 800);
  };

  const filterStyles: Record<VideoFilter, string> = {
    normal: '',
    vibrant: 'contrast-105 saturate-125',
    cyberpunk: 'contrast-115 saturate-140 hue-rotate-15',
    noir: 'grayscale contrast-125',
  };

  return (
    <div className="space-y-4">
      {/* Broadcast Telemetry & Source Switcher Bar (Left-Right Scrollable on Devices) */}
      <div className="p-3.5 rounded-2xl glass-panel border border-surfaceBorder flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto flex-nowrap touch-pan-x">
          <span className="text-xs font-bold text-gray-400 shrink-0">Stream Source:</span>
          <div className="shrink-0 flex items-center p-0.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs font-semibold">
            <button
              onClick={() => handleSaveSource('WEBRTC')}
              className={`shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                sourceMode === 'WEBRTC'
                  ? 'bg-brandPurple text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Camera & Mic</span>
            </button>

            <button
              onClick={() => {
                fetchIngress();
                handleSaveSource('RTMP');
              }}
              className={`shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                sourceMode === 'RTMP'
                  ? 'bg-brandPurple text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>OBS / RTMP</span>
            </button>

            <button
              onClick={() => handleSaveSource('EXTERNAL_EMBED')}
              className={`shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                sourceMode === 'EXTERNAL_EMBED'
                  ? 'bg-brandPurple text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>External Feed</span>
            </button>
          </div>
        </div>

        {/* Live Broadcast Telemetry Stats & Main Start/Stop Action Button */}
        <div className="flex items-center gap-2.5 text-xs overflow-x-auto no-scrollbar py-1 w-full md:w-auto flex-nowrap touch-pan-x justify-start md:justify-end">
          {isLive && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>REC {formatStopwatch(elapsedSeconds)}</span>
            </div>
          )}

          <div className="shrink-0 hidden sm:flex items-center gap-1.5 text-emerald-400 font-semibold px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5" />
            <span>1080p • 60 FPS</span>
          </div>

          {/* Quick Start / Stop Button in Toolbar */}
          {!isLive ? (
            <button
              onClick={onStartStream}
              disabled={isActionLoading}
              className="shrink-0 btn-glow-purple px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isActionLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isActionLoading ? 'Starting...' : 'GO LIVE'}</span>
            </button>
          ) : (
            <button
              onClick={onEndStream}
              disabled={isActionLoading}
              className="shrink-0 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 transition-all disabled:opacity-50"
            >
              {isActionLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isActionLoading ? 'Ending...' : 'STOP STREAM'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Preview Surface (Proportional to Laptop or Phone Device) */}
      <div className={`relative rounded-2xl bg-black border border-surfaceBorder overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${getContainerAspectClass()}`}>
        {/* Screen Share Layer */}
        {isScreenSharing && (
          <video
            ref={screenPreviewRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-contain bg-black z-0"
          />
        )}

        {/* Camera Feed Surface */}
        {sourceMode !== 'EXTERNAL_EMBED' ? (
          <>
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`${videoFit === 'cover' ? 'object-cover' : 'object-contain'} transition-all duration-300 ${
                isScreenSharing
                  ? 'absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-32 h-18 sm:w-48 sm:h-28 rounded-xl border-2 border-brandPurple shadow-2xl z-20'
                  : 'absolute inset-0 w-full h-full'
              } ${!isVideoEnabled || permissionError ? 'hidden' : 'block'} ${
                isMirrored ? '-scale-x-100' : ''
              } ${filterStyles[selectedFilter]}`}
            />

            {/* Fallback Screen when Video Disabled or No Camera */}
            {sourceMode === 'RTMP' && (!isVideoEnabled || permissionError) && !isScreenSharing && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10">
                <div className="p-4 rounded-2xl bg-brandPurple/10 border border-brandPurple/20 text-brandPurple animate-pulse">
                  <Radio className="w-10 h-10" />
                </div>
                <div className="text-sm font-bold text-white">OBS / RTMP Ingest Mode Active</div>
                <p className="text-xs text-gray-400 max-w-sm">
                  Broadcast live from OBS Studio, Streamlabs, or vMix using your stream key.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowObsDrawer(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-brandPurple hover:bg-brandPurple/80 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-brandPurple/30"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>View Stream Key & RTMP URL</span>
                  </button>
                  <button
                    onClick={startSimulatedCamera}
                    className="px-3 py-1.5 rounded-xl bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-gray-300 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Test Pattern</span>
                  </button>
                </div>
              </div>
            )}

            {sourceMode !== 'RTMP' && (!isVideoEnabled || permissionError) && !isScreenSharing && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10">
                <div className="p-4 rounded-2xl bg-surfaceLight border border-surfaceBorder text-brandPurple animate-pulse-subtle">
                  <VideoOff className="w-10 h-10" />
                </div>
                <div className="text-sm font-bold text-white">Camera Preview Disabled</div>
                <p className="text-xs text-gray-400 max-w-sm">
                  {permissionError || 'Click "Video On" below to enable camera stream.'}
                </p>
                <button
                  onClick={startSimulatedCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-brandPurple/20 hover:bg-brandPurple/30 border border-brandPurple/40 text-brandPurple text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use Studio Test Pattern Feed</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* External Stream Embed Preview */}
            {externalUrl ? (
              <video
                ref={externalPreviewRef}
                autoPlay
                playsInline
                muted
                loop
                className={`absolute inset-0 w-full h-full ${videoFit === 'cover' ? 'object-cover' : 'object-contain'} transition-all duration-300`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 animate-pulse">
                  <Globe className="w-10 h-10" />
                </div>
                <div className="text-sm font-bold text-white">External Stream Embed Mode</div>
                <p className="text-xs text-gray-400 max-w-sm">
                  Enter your Cloudinary or HLS video link below to stream it live.
                </p>
              </div>
            )}
          </>
        )}

        {/* Top Badges & Live Status Overlay - Scrollable Left-Right on Small Devices */}
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 flex items-center justify-between gap-2 pointer-events-none z-30">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-nowrap touch-pan-x max-w-[55%] sm:max-w-none">
            <span
              className={`shrink-0 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                isLive ? 'bg-red-600 text-white' : 'bg-gray-800/80 text-gray-300 border border-white/10'
              }`}
            >
              <Radio className={`w-3 h-3 ${isLive ? 'animate-ping' : ''}`} />
              {isLive ? '🔴 ON AIR' : '⚪ READY TO BROADCAST'}
            </span>

            {/* Device & Aspect Ratio Indicator Tag */}
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

            {isScreenSharing && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                <Monitor className="w-3 h-3" /> Screen
              </span>
            )}

            {sourceMode === 'EXTERNAL_EMBED' ? (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> External
              </span>
            ) : sourceMode === 'RTMP' ? (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                RTMP
              </span>
            ) : livekitConnected ? (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> WebRTC
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-nowrap touch-pan-x pointer-events-auto">
            {/* Live Button on Video Surface */}
            {!isLive ? (
              <button
                onClick={onStartStream}
                disabled={isActionLoading}
                className="shrink-0 btn-glow-purple px-3 sm:px-4 py-1.5 rounded-full text-xs font-black text-white flex items-center gap-1.5 shadow-xl hover:scale-105 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>GO LIVE</span>
              </button>
            ) : (
              <button
                onClick={onEndStream}
                disabled={isActionLoading}
                className="shrink-0 px-3 sm:px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-xs font-black text-white flex items-center gap-1.5 shadow-xl transition hover:scale-105 disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP</span>
              </button>
            )}

            {/* Soundboard Toggle */}
            <button
              onClick={() => setShowSoundboard(!showSoundboard)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-tokenGold border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow"
              title="Broadcast Soundboard & SFX"
            >
              <Music className="w-3.5 h-3.5" />
              <span>SFX</span>
            </button>

            {/* Interactive Toy Modal */}
            <button
              onClick={() => setShowToyModal(true)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-pink-600/80 hover:bg-pink-600 text-white border border-pink-400/40 text-xs font-bold flex items-center gap-1.5 transition shadow"
              title="Pair Lovense or Bluetooth Interactive Toy"
            >
              <Zap className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>Toy</span>
            </button>

            {/* OBS Credentials Drawer */}
            <button
              onClick={fetchIngress}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-surfaceLight/90 hover:bg-surfaceLight text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Key className="w-3.5 h-3.5 text-tokenGold" />
              <span>OBS</span>
            </button>

            {/* Copy Watch Room Link */}
            {streamId && (
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/watch/${streamId}`, 'room')}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-surfaceLight/90 hover:bg-surfaceLight text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Copy Public Stream Link"
              >
                {copiedRoomLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-brandPurple" />}
                <span>{copiedRoomLink ? 'Copied!' : 'Share'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Soundboard Floating Panel */}
        {showSoundboard && (
          <div className="absolute top-14 right-4 z-40 p-3 rounded-2xl bg-surface/95 backdrop-blur-md border border-surfaceBorder shadow-2xl flex flex-col gap-2 animate-fade-in pointer-events-auto">
            <div className="text-[11px] font-extrabold text-white flex items-center justify-between gap-4 pb-1 border-b border-surfaceBorder/60">
              <span>Studio Soundboard (SFX)</span>
              <button onClick={() => setShowSoundboard(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => playSfx('airhorn')}
                className={`px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-amber-500 text-amber-400 flex items-center gap-1.5 transition ${
                  activeSfx === 'airhorn' ? 'scale-105 border-amber-400 bg-amber-500/20' : ''
                }`}
              >
                <span>🎺 Airhorn</span>
              </button>
              <button
                onClick={() => playSfx('coin')}
                className={`px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-yellow-400 text-yellow-300 flex items-center gap-1.5 transition ${
                  activeSfx === 'coin' ? 'scale-105 border-yellow-400 bg-yellow-500/20' : ''
                }`}
              >
                <span>🪙 Tip Chime</span>
              </button>
              <button
                onClick={() => playSfx('victory')}
                className={`px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-purple-400 text-purple-300 flex items-center gap-1.5 transition ${
                  activeSfx === 'victory' ? 'scale-105 border-purple-400 bg-purple-500/20' : ''
                }`}
              >
                <span>🏆 Victory</span>
              </button>
              <button
                onClick={() => playSfx('bass')}
                className={`px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder hover:border-pink-400 text-pink-300 flex items-center gap-1.5 transition ${
                  activeSfx === 'bass' ? 'scale-105 border-pink-400 bg-pink-500/20' : ''
                }`}
              >
                <span>💣 Bass Drop</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Audio VU Meter & Status */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <Volume2 className={`w-3.5 h-3.5 ${isAudioEnabled ? 'text-emerald-400' : 'text-gray-500'}`} />
            <canvas
              ref={audioMeterCanvasRef}
              width={110}
              height={10}
              className="rounded-full overflow-hidden"
            />
          </div>

          <div className="text-[11px] text-gray-300 font-medium bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            {livekitMessage || (isLive ? 'Streaming Live' : 'Studio Standby')}
          </div>
        </div>
      </div>

      {/* Studio Action Controls & Device Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-surfaceBorder">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Device Selection Dropdowns (Scrollable Left-Right on Small Devices) */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 w-full lg:w-auto flex-nowrap touch-pan-x">
            {/* Camera Select */}
            <div className="shrink-0 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-brandPurple flex-shrink-0" />
              <select
                value={selectedVideoDeviceId}
                onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-gray-200 text-xs font-medium focus:outline-none focus:border-brandPurple max-w-[160px] truncate"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
                {videoDevices.length === 0 && <option value="">Default Web Camera</option>}
              </select>
            </div>

            {/* Mic Select */}
            <div className="shrink-0 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-brandPink flex-shrink-0" />
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-gray-200 text-xs font-medium focus:outline-none focus:border-brandPurple max-w-[160px] truncate"
              >
                {audioDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
                {audioDevices.length === 0 && <option value="">Default Microphone</option>}
              </select>
            </div>
          </div>

          {/* Quick Hardware & Feature Action Toggles (Scrollable Left-Right Ribbon on Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full lg:w-auto flex-nowrap touch-pan-x">
            {/* Screen Share Button */}
            <button
              onClick={toggleScreenShare}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isScreenSharing
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-surfaceLight hover:bg-surfaceBorder text-gray-300 border border-surfaceBorder'
              }`}
            >
              {isScreenSharing ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5 text-blue-400" />}
              <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>

            {/* Video Mute Toggle */}
            <button
              onClick={toggleVideo}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isVideoEnabled
                  ? 'bg-surfaceLight hover:bg-surfaceBorder text-white border border-surfaceBorder'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isVideoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              <span>{isVideoEnabled ? 'Video On' : 'Video Off'}</span>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={toggleAudio}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isAudioEnabled
                  ? 'bg-surfaceLight hover:bg-surfaceBorder text-white border border-surfaceBorder'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>{isAudioEnabled ? 'Mic On' : 'Muted'}</span>
            </button>

            {/* Mirror Toggle */}
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                isMirrored
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                  : 'bg-surfaceLight border-surfaceBorder text-gray-300 hover:text-white'
              }`}
              title="Mirror camera preview horizontally"
            >
              <span>Mirror {isMirrored ? '✓' : ''}</span>
            </button>

            {/* Camera Filters Dropdown */}
            <div className="shrink-0 relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-3 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Sliders className="w-3.5 h-3.5 text-brandPurple" />
                <span>Filter: {selectedFilter}</span>
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl bg-surface border border-surfaceBorder shadow-2xl p-1 z-50 text-xs">
                  {(['normal', 'vibrant', 'cyberpunk', 'noir'] as VideoFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setSelectedFilter(f);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg capitalize transition ${
                        selectedFilter === f ? 'bg-brandPurple text-white font-bold' : 'text-gray-300 hover:bg-surfaceLight'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Screen Proportions & Device Aspect Ratio Selector */}
            <div className="shrink-0 flex items-center p-0.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAspectMode('AUTO')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                  aspectMode === 'AUTO'
                    ? 'bg-brandPurple text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Auto Proportional to Device (Phone or Laptop)"
              >
                {isMobileDevice && isPortrait ? (
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Laptop className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Auto</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectMode('16:9')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                  aspectMode === '16:9'
                    ? 'bg-brandPurple text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Laptop & Desktop Widescreen 16:9"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>16:9</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectMode('9:16')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                  aspectMode === '9:16'
                    ? 'bg-brandPurple text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Mobile Phone Vertical 9:16"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16</span>
              </button>
            </div>

            {/* Fit / Fill Toggle */}
            <button
              type="button"
              onClick={() => setVideoFit(videoFit === 'cover' ? 'contain' : 'cover')}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                videoFit === 'cover'
                  ? 'bg-surfaceLight border-surfaceBorder text-gray-300 hover:text-white'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              }`}
              title="Toggle between Fill Screen (Cover) and Full Frame (Contain)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{videoFit === 'cover' ? 'Fill' : 'Fit'}</span>
            </button>

            {/* Flip Camera (Phone front/rear switch) */}
            {videoDevices.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedVideoDeviceId);
                  const nextIndex = (currentIndex + 1) % videoDevices.length;
                  setSelectedVideoDeviceId(videoDevices[nextIndex].deviceId);
                }}
                className="shrink-0 px-3 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                title="Flip Camera (Front / Rear)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Flip Cam</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cloudinary & External Stream Configuration Card */}
      {sourceMode === 'EXTERNAL_EMBED' && (
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-surface to-surface space-y-4 animate-fade-in shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cloudinary & External Video Stream Ingest</h3>
              <p className="text-xs text-gray-400">
                Embed video links from Cloudinary, HLS (.m3u8), or direct MP4 CDN links to broadcast live in real time.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300">External Video or HLS Stream URL:</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="e.g. https://res.cloudinary.com/demo/video/upload/sample.mp4 or https://.../stream.m3u8"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surfaceLight border border-surfaceBorder text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition"
              />
              <button
                type="button"
                onClick={() => handleSaveSource('EXTERNAL_EMBED', externalUrl)}
                disabled={isSavingSource || !externalUrl.trim()}
                className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 flex items-center gap-1.5 transition shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isSavingSource ? 'Connecting...' : 'Broadcast Feed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OBS / RTMP Settings Modal Drawer */}
      {showObsDrawer && ingressData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-brandPurple">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">OBS Studio / RTMP Stream Ingest</h3>
                  <p className="text-xs text-gray-400">Stream from OBS, Streamlabs, or mobile hardware</p>
                </div>
              </div>
              <button
                onClick={() => setShowObsDrawer(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">RTMP Server URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={ingressData.rtmpServer}
                    className="flex-1 px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(ingressData.rtmpServer, 'url')}
                    className="p-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-gray-300 transition"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Stream Key (Keep Private)</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showStreamKey ? 'text' : 'password'}
                    readOnly
                    value={ingressData.streamKey}
                    className="flex-1 px-3 py-2 rounded-xl bg-surfaceLight border border-surfaceBorder text-white font-mono text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStreamKey(!showStreamKey)}
                    className="p-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-gray-300 transition"
                    title={showStreamKey ? 'Hide Stream Key' : 'Reveal Stream Key'}
                  >
                    {showStreamKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(ingressData.streamKey, 'key')}
                    className="p-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-gray-300 transition"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                <strong>OBS Setup Instructions:</strong> In OBS Studio, open <em>Settings → Stream</em>, select Service <em>Custom...</em>, paste the RTMP Server URL above, enter your Stream Key, set Keyframe Interval to <code>2s</code>, and click <em>Start Streaming</em>.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowObsDrawer(false)}
                className="px-4 py-2 rounded-xl bg-surfaceLight hover:bg-surfaceBorder text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Toy Pairing Modal */}
      <ToyPairingModal
        isOpen={showToyModal}
        onClose={() => setShowToyModal(false)}
      />
    </div>
  );
}
