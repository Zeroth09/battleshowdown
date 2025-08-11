'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Play, Square, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function GameMasterPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<string>('');
  const router = useRouter();

  const backendUrl = useMemo(() => (
    process.env.NEXT_PUBLIC_BACKEND_URL || 'https://battleshowdownback-production.up.railway.app'
  ), []);

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('lobby-update', (data: any) => {
      setPlayersCount(data?.count || 0);
    });

    s.on('global-battle-start', () => {
      setLastEvent('Global battle started');
    });

    s.on('global-battle-end', () => {
      setLastEvent('Global battle ended');
    });

    setSocket(s);
    return () => {
      s.close();
    };
  }, [backendUrl]);

  const gameMasterId = useMemo(() => `gm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, []);

  const triggerBattle = () => {
    if (!socket) return;
    socket.emit('game-master-trigger-battle', { gameMasterId });
  };

  const endBattle = () => {
    if (!socket) return;
    socket.emit('game-master-end-battle', { result: { reason: 'ended-by-gm' }, gameMasterId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <div className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Game Master Panel</h1>
                <p className="text-sm text-gray-500">Trigger pertanyaan secara real-time</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isConnected ? 'Terhubung' : 'Terputus'}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Play className="w-6 h-6 text-red-600 mr-2" />
                Kontrol Pertempuran
              </h2>

              <div className="flex items-center space-x-4">
                <button onClick={triggerBattle} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center">
                  <Play className="w-5 h-5 mr-2" /> Mulai Pertanyaan
                </button>
                <button onClick={endBattle} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl flex items-center">
                  <Square className="w-5 h-5 mr-2" /> Akhiri Pertanyaan
                </button>
              </div>

              {lastEvent && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
                  {lastEvent}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-6 h-6 text-red-600 mr-2" />
                Peserta Online
              </h2>
              <div className="text-center">
                <div className="text-5xl font-extrabold text-gray-900 mb-2">{playersCount}</div>
                <p className="text-gray-500">Total peserta terhubung</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 