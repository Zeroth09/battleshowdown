'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Zap, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PemainData {
  nama: string;
  tim: string;
  masukAt: string;
  pemainId?: string;
}

interface Pertanyaan {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  waktu: number;
}

// Dynamic import SocketManager (client-only)
const SocketManager = dynamic(() => import('../../components/SocketManager'), { ssr: false });

export default function LobbyPage() {
  const [pemainData, setPemainData] = useState<PemainData | null>(null);
  const [pemainLain, setPemainLain] = useState<PemainData[]>([]);
  const [status, setStatus] = useState<'menunggu' | 'pertanyaan'>('menunggu');
  const [pertanyaan, setPertanyaan] = useState<Pertanyaan | null>(null);
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [jawabanDipilih, setJawabanDipilih] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Ambil data pemain dari localStorage
    const data = localStorage.getItem('pemainData');
    if (!data) {
      router.push('/');
      return;
    }

    const parsedData: PemainData = JSON.parse(data);

    // Ensure pemainId exists for socket identification
    if (!parsedData.pemainId) {
      parsedData.pemainId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('pemainData', JSON.stringify(parsedData));
    }

    setPemainData(parsedData);

    // Simulasi pemain lain (placeholder, nanti bisa dari WebSocket)
    setPemainLain([
      { nama: 'Budi', tim: 'merah', masukAt: new Date().toISOString() },
      { nama: 'Sari', tim: 'putih', masukAt: new Date().toISOString() },
      { nama: 'Rudi', tim: 'merah', masukAt: new Date().toISOString() },
      { nama: 'Dewi', tim: 'putih', masukAt: new Date().toISOString() },
    ]);
  }, [router]);

  const userForSocket = useMemo(() => {
    if (!pemainData) return null;
    return {
      pemainId: pemainData.pemainId as string,
      nama: pemainData.nama,
      tim: pemainData.tim === 'merah' ? 'merah' as const : 'putih' as const,
    };
  }, [pemainData]);

  const handleBattleStart = (battleData: any) => {
    // Map battle data to local pertanyaan shape
    const pilihanArray: string[] = battleData?.pilihanJawaban
      ? Object.values(battleData.pilihanJawaban).map((v) => String(v))
      : [];

    setPertanyaan({
      id: battleData?.id || 'unknown',
      pertanyaan: battleData?.pertanyaan || '',
      pilihan: pilihanArray,
      waktu: 0,
    });
    setJawabanDipilih(null);
    setWaktuTersisa(0);
    setStatus('pertanyaan');
  };

  const handleBattleEnd = () => {
    // Kembali ke status menunggu ketika battle selesai
    setStatus('menunggu');
    setPertanyaan(null);
    setJawabanDipilih(null);
    setWaktuTersisa(0);
  };

  const handleJawab = (jawaban: string) => {
    setJawabanDipilih(jawaban);
  };

  if (!pemainData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Socket manager for receiving Game Master triggers */}
      {userForSocket && (
        <SocketManager
          user={userForSocket}
          onBattleStart={handleBattleStart}
          onBattleEnd={handleBattleEnd}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${pemainData.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
              <span className="font-semibold text-gray-900">{pemainData.nama}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pemainData.tim === 'merah' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                Tim {pemainData.tim === 'merah' ? 'Merah' : 'Putih'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Lobby Battle
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {status === 'menunggu' && (
                <motion.div
                  key="menunggu"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Menunggu Pertanyaan
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Game Master sedang menyiapkan pertanyaan untuk kamu. Sabar ya!
                    </p>
                    <div className="inline-flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 font-medium">Menunggu...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'pertanyaan' && pertanyaan && (
                <motion.div
                  key="pertanyaan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  {/* Timer - tampilkan hanya jika > 0 */}
                  {waktuTersisa > 0 && (
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span className="text-red-700 font-bold text-lg">
                          {waktuTersisa}s
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pertanyaan */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {pertanyaan.pertanyaan}
                    </h2>

                    {/* Pilihan Jawaban */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pertanyaan.pilihan.map((pilihan, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleJawab(pilihan)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            jawabanDipilih === pilihan
                              ? 'border-red-500 bg-red-500 text-white shadow-lg'
                              : 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                          }`}
                        >
                          <span className="font-semibold text-lg">{pilihan}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {jawabanDipilih && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Jawaban dipilih: {jawabanDipilih}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Daftar Pemain */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <div className="flex items-center space-x-2 mb-6">
                <Users className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Pemain Online</h3>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                  {pemainLain.length + 1}
                </span>
              </div>

              <div className="space-y-3">
                {/* Pemain saat ini */}
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${pemainData.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium text-gray-900">{pemainData.nama}</span>
                  <span className="text-xs text-gray-500">(Kamu)</span>
                </div>

                {/* Pemain lain */}
                {pemainLain.map((p, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border border-red-100 rounded-xl">
                    <div className={`w-3 h-3 rounded-full ${p.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-900">{p.nama}</span>
                    <span className="text-xs text-gray-500">({new Date(p.masukAt).toLocaleTimeString()})</span>
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