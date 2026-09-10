'use client';

import React, { useState, useEffect } from 'react';
import { HapticsManager, HapticDevice, DEFAULT_VIBRATION_RULES, VibrationRule } from '@/lib/haptics/hapticsManager';
import { Bluetooth, Zap, Battery, Check, X, Sliders, RefreshCw, Radio } from 'lucide-react';

interface ToyPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ToyPairingModal({ isOpen, onClose }: ToyPairingModalProps) {
  const [devices, setDevices] = useState<HapticDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [testStrength, setTestStrength] = useState(12);
  const [isTesting, setIsTesting] = useState(false);
  const [rules, setRules] = useState<VibrationRule[]>(DEFAULT_VIBRATION_RULES);

  const manager = HapticsManager.getInstance();

  const refreshDevices = () => {
    setDevices(manager.getDevices());
  };

  useEffect(() => {
    if (isOpen) {
      refreshDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectBluetooth = async () => {
    setError('');
    setIsScanning(true);
    try {
      await manager.connectWebBluetooth();
      refreshDevices();
    } catch (e: any) {
      setError(e.message || 'Failed to connect via Bluetooth');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectVirtual = async () => {
    setError('');
    try {
      await manager.connectLovenseLocal();
      refreshDevices();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleTestVibrate = async () => {
    setIsTesting(true);
    await manager.vibrate(testStrength, 3);
    setTimeout(() => setIsTesting(false), 3000);
  };

  const handleDisconnect = (id: string) => {
    manager.disconnect(id);
    refreshDevices();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-surfaceBorder p-6 shadow-2xl overflow-hidden space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surfaceBorder">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Interactive Toy & Bluetooth Haptics</span>
                <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400 text-[10px] font-extrabold uppercase">
                  Lovense / Buttplug.io
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Connect your Bluetooth toy. Viewer tips will automatically trigger real-time vibrations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceLight transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Connected Hardware List */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300">Connected Haptic Toys:</label>
          {devices.length === 0 ? (
            <div className="p-4 rounded-xl bg-surfaceLight/50 border border-dashed border-surfaceBorder text-center text-xs text-gray-400 space-y-1">
              <p>No interactive toys currently connected.</p>
              <p className="text-[11px] text-gray-500">
                Turn on your toy&apos;s Bluetooth and click &quot;Pair Bluetooth LE Toy&quot; below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3 rounded-xl bg-surfaceLight border border-pink-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                      <Bluetooth className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{dev.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                          Online
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Battery className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{dev.batteryLevel}% Battery</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisconnect(dev.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleConnectBluetooth}
            disabled={isScanning}
            className="btn-glow-purple p-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Bluetooth className="w-4 h-4" />
            <span>{isScanning ? 'Scanning Devices...' : 'Pair Web Bluetooth LE'}</span>
          </button>

          <button
            onClick={handleConnectVirtual}
            className="p-3 rounded-xl bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-xs font-bold text-pink-300 flex items-center justify-center gap-2 transition"
          >
            <Radio className="w-4 h-4" />
            <span>Connect Virtual / LAN Toy</span>
          </button>
        </div>

        {/* Test Vibration Slider */}
        <div className="p-4 rounded-xl bg-surfaceLight border border-surfaceBorder space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brandPurple" />
              <span>Test Vibration Strength:</span>
            </span>
            <span className="font-black text-pink-400 text-sm">Level {testStrength} / 20</span>
          </div>

          <input
            type="range"
            min="1"
            max="20"
            value={testStrength}
            onChange={(e) => setTestStrength(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />

          <button
            onClick={handleTestVibrate}
            disabled={isTesting}
            className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              isTesting
                ? 'bg-pink-600 text-white animate-pulse'
                : 'bg-surface hover:bg-surfaceBorder text-gray-200 border border-surfaceBorder'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
            <span>{isTesting ? 'Vibrating Toy for 3s...' : 'Send Test Pulse (3 Seconds)'}</span>
          </button>
        </div>

        {/* Tip Tiers Table */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400">Automatic Tip Levels:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {rules.map((r, i) => (
              <div key={i} className="p-2 rounded-xl bg-surfaceLight/60 border border-surfaceBorder text-[11px]">
                <div className="font-black text-tokenGold">{r.minTokens}-{r.maxTokens > 1000 ? '999+' : r.maxTokens} tkns</div>
                <div className="text-gray-300 font-semibold mt-0.5">Lvl {r.strength} ({r.durationSeconds}s)</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-surfaceBorder">
          <button
            onClick={onClose}
            className="btn-glow-purple px-5 py-2.5 rounded-xl text-xs font-bold text-white"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
