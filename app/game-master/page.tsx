'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Trophy, 
  Eye, 
  Play,
  Pause,
  Square
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Pertanyaan {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  jawabanBenar: string;
  waktu: number;
}

interface Pemain {
  id: string;
  nama: string;
  tim: string;
  status: 'online' | 'offline';
  skor: number;
}

export default function GameMasterPage() {
  const [statusGame, setStatusGame] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [pemainOnline, setPemainOnline] = useState<Pemain[]>([]);
  const [pertanyaanAktif, setPertanyaanAktif] = useState<Pertanyaan | null>(null);
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameMasterId, setGameMasterId] = useState<string>('');

  useEffect(() => {
    const existingId = localStorage.getItem('gameMasterId') || `gm_${Date.now()}`;
    localStorage.setItem('gameMasterId', existingId);
    setGameMasterId(existingId);
  }, []);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const s = io(backendUrl, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    s.on('lobby-update', (data: any) => {
      try {
        const players = Array.isArray(data?.players) ? data.players : [];
        const mapped: Pemain[] = players.map((p: any) => ({
          id: p.pemainId,
          nama: p.nama,
          tim: p.tim,
          status: 'online',
          skor: 0,
        }));
        setPemainOnline(mapped);
      } catch (e) {
        console.error('Error mapping lobby-update:', e);
      }
    });

    s.on('global-battle-start', (data: any) => {
      try {
        const battleData = data?.battleData;
        if (battleData) {
          setStatusGame('playing');
          setPertanyaanAktif({
            id: battleData.id,
            pertanyaan: battleData.pertanyaan,
            pilihan: Object.values(battleData.pilihanJawaban || {}),
            jawabanBenar: battleData.jawabanBenar,
            waktu: 30,
          });
          setWaktuTersisa(30);
        }
      } catch (e) {
        console.error('Error handling global-battle-start on GM:', e);
      }
    });

    s.on('global-battle-end', () => {
      setStatusGame('idle');
      setPertanyaanAktif(null);
      setWaktuTersisa(0);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (statusGame === 'playing' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            setStatusGame('idle');
            setPertanyaanAktif(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusGame, waktuTersisa]);

  const handleTriggerPertanyaanAcak = () => {
    if (!socket || !isConnected) {
      alert('Belum terhubung ke server. Coba lagi sebentar.');
      return;
    }
    socket.emit('game-master-trigger-battle', {
      gameMasterId,
    });
  };

  const handlePauseGame = () => {
    setStatusGame('paused');
  };

  const handleResumeGame = () => {
    setStatusGame('playing');
  };

  const handleStopGame = () => {
    setStatusGame('idle');
    setPertanyaanAktif(null);
    setWaktuTersisa(0);
    if (socket && isConnected) {
      socket.emit('game-master-end-battle', {
        result: { message: 'Battle dihentikan oleh Game Master' },
        gameMasterId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Game Master Panel</h1>
                <p className="text-sm text-gray-500">Kontrol game battle showdown</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/spectator')}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Spectator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Kontrol Pertanyaan */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Kontrol Pertanyaan</h2>
              <p className="text-gray-600 mb-6">Pertanyaan diambil acak dari Google Sheets dan dikirim ke semua peserta.</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleTriggerPertanyaanAcak}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all flex items-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Kirim Pertanyaan Acak
                </button>
                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isConnected ? 'Terhubung ke Server' : 'Terputus' }
                </div>
              </div>

              {pertanyaanAktif && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Pertanyaan Aktif</h3>
                  <p className="text-gray-800 mb-4">{pertanyaanAktif.pertanyaan}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {pertanyaanAktif.pilihan.map((p, i) => (
                      <div key={i} className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-gray-700">
                        {String.fromCharCode(65 + i)}. {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Status Game & Pemain */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Game */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-red-600 mr-2" />
                Status Game
              </h3>
              
              {statusGame === 'idle' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Square className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Game belum dimulai</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {statusGame === 'playing' ? (
                      <Play className="w-8 h-8 text-red-600" />
                    ) : (
                      <Pause className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {pertanyaanAktif?.pertanyaan}
                  </h4>
                  
                  <div className="text-3xl font-bold text-red-600 mb-4">
                    {waktuTersisa}s
                  </div>
                  
                  <div className="flex space-x-2">
                    {statusGame === 'playing' ? (
                      <button
                        onClick={handlePauseGame}
                        className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={handleResumeGame}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={handleStopGame}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Daftar Pemain */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 text-red-600 mr-2" />
                Pemain Online ({pemainOnline.filter(p => p.status === 'online').length})
              </h3>
              
              <div className="space-y-3">
                {pemainOnline.map((pemain) => (
                  <div key={pemain.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${pemain.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium text-gray-900">{pemain.nama}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pemain.tim === 'merah' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {pemain.tim === 'merah' ? 'Merah' : 'Putih'}
                      </span>
                      <span className="text-sm text-gray-500">{pemain.skor}</span>
                      <div className={`w-2 h-2 rounded-full ${pemain.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 