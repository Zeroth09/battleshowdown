'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Users, 
  Clock, 
  Trophy, 
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Pemain {
  id: string;
  nama: string;
  tim: string;
  skor: number;
  status: 'online' | 'offline';
  jawabanTerakhir?: string;
  waktuJawab?: number;
}

interface Pertanyaan {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  jawabanBenar: string;
  waktu: number;
}

interface StatistikTim {
  merah: {
    totalSkor: number;
    pemainCount: number;
    rataRataSkor: number;
    jawabanBenar: number;
  };
  putih: {
    totalSkor: number;
    pemainCount: number;
    rataRataSkor: number;
    jawabanBenar: number;
  };
}

interface HasilPertanyaan {
  jawabanBenar: string;
  skorTim: { merah: number; putih: number };
  pemenang: string;
  statistikJawaban: Record<string, number>;
}

// Dynamic import SocketManager (client-only)
const SocketManager = dynamic(() => import('../../components/SocketManager'), { ssr: false });

export default function SpectatorPage() {
  const [pemain, setPemain] = useState<Pemain[]>([]);
  const [pertanyaanAktif, setPertanyaanAktif] = useState<Pertanyaan | null>(null);
  const [statusGame, setStatusGame] = useState<'menunggu' | 'pertanyaan' | 'hasil'>('menunggu');
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [statistikTim, setStatistikTim] = useState<StatistikTim>({
    merah: { totalSkor: 0, pemainCount: 0, rataRataSkor: 0, jawabanBenar: 0 },
    putih: { totalSkor: 0, pemainCount: 0, rataRataSkor: 0, jawabanBenar: 0 }
  });
  const [hasilPertanyaan, setHasilPertanyaan] = useState<HasilPertanyaan | null>(null);
  const router = useRouter();

  // Minimal user for spectator connection
  const spectatorUser = useMemo(() => ({
    pemainId: `spectator_${typeof window !== 'undefined' ? window.location.pathname : ''}_${Date.now()}`,
    nama: 'Spectator',
    tim: 'merah' as const,
  }), []);

  useEffect(() => {
    // Simulasi data pemain untuk tampilan
    const dataPemain: Pemain[] = [
      { id: '1', nama: 'Budi', tim: 'merah', skor: 85, status: 'online' },
      { id: '2', nama: 'Sari', tim: 'putih', skor: 92, status: 'online' },
      { id: '3', nama: 'Rudi', tim: 'merah', skor: 78, status: 'online' },
      { id: '4', nama: 'Dewi', tim: 'putih', skor: 88, status: 'online' },
      { id: '5', nama: 'Ahmad', tim: 'merah', skor: 65, status: 'offline' },
      { id: '6', nama: 'Nina', tim: 'putih', skor: 95, status: 'online' },
      { id: '7', nama: 'Joko', tim: 'merah', skor: 72, status: 'online' },
      { id: '8', nama: 'Maya', tim: 'putih', skor: 81, status: 'online' },
    ];
    setPemain(dataPemain);

    // Hitung statistik tim (dummy)
    const merah = dataPemain.filter(p => p.tim === 'merah');
    const putih = dataPemain.filter(p => p.tim === 'putih');
    setStatistikTim({
      merah: {
        totalSkor: merah.reduce((sum, p) => sum + p.skor, 0),
        pemainCount: merah.length,
        rataRataSkor: Math.round(merah.reduce((sum, p) => sum + p.skor, 0) / merah.length),
        jawabanBenar: Math.floor(Math.random() * 15) + 10
      },
      putih: {
        totalSkor: putih.reduce((sum, p) => sum + p.skor, 0),
        pemainCount: putih.length,
        rataRataSkor: Math.round(putih.reduce((sum, p) => sum + p.skor, 0) / putih.length),
        jawabanBenar: Math.floor(Math.random() * 15) + 10
      }
    });
  }, []);

  // Socket handlers: gate question display until GM triggers
  const handleBattleStart = (battleData: any) => {
    const pilihanArray: string[] = battleData?.pilihanJawaban ? Object.values(battleData.pilihanJawaban).map((v) => String(v)) : [];
    setPertanyaanAktif({
      id: battleData?.id || 'unknown',
      pertanyaan: battleData?.pertanyaan || '',
      pilihan: pilihanArray,
      jawabanBenar: battleData?.jawabanBenar || '',
      waktu: 0,
    });
    setStatusGame('pertanyaan');
    setWaktuTersisa(0);
    setHasilPertanyaan(null);
  };

  const handleBattleEnd = (result: any) => {
    // Optional: tampilkan hasil jika tersedia
    if (result && result.jawabanBenar) {
      setHasilPertanyaan({
        jawabanBenar: result.jawabanBenar,
        skorTim: result.skorTim || { merah: 0, putih: 0 },
        pemenang: result.pemenang || '',
        statistikJawaban: result.statistikJawaban || {},
      });
      setStatusGame('hasil');
    } else {
      // Jika tidak ada hasil, kembali ke menunggu
      setPertanyaanAktif(null);
      setStatusGame('menunggu');
      setHasilPertanyaan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Socket manager to receive Game Master triggers */}
      <SocketManager user={spectatorUser} onBattleStart={handleBattleStart} onBattleEnd={handleBattleEnd} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/game-master')}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-red-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Spectator Mode</h1>
                <p className="text-sm text-gray-500">Lihat game dari sisi penonton</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Live View
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Game Status */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {statusGame === 'menunggu' && (
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
                    <p className="text-gray-600">
                      Game Master sedang menyiapkan pertanyaan berikutnya...
                    </p>
                  </div>
                </motion.div>
              )}

              {statusGame === 'pertanyaan' && pertanyaanAktif && (
                <motion.div
                  key="pertanyaan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  {/* Timer */}
                  {waktuTersisa > 0 && (
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center space-x-2 bg-red-100 px-6 py-3 rounded-full">
                        <Clock className="w-5 h-5 text-red-600" />
                        <span className="text-red-700 font-bold text-2xl">
                          {waktuTersisa}s
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pertanyaan */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      {pertanyaanAktif.pertanyaan}
                    </h2>
                    {/* Pilihan Jawaban */}
                    <div className="grid grid-cols-2 gap-4">
                      {pertanyaanAktif.pilihan.map((pilihan, index) => (
                        <div
                          key={index}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            pilihan === pertanyaanAktif.jawabanBenar
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <span className="font-semibold text-lg text-gray-900">
                            {String.fromCharCode(65 + index)}. {pilihan}
                          </span>
                          {pilihan === pertanyaanAktif.jawabanBenar && (
                            <div className="mt-2 text-green-600 font-bold">✓ Jawaban Benar</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {statusGame === 'hasil' && hasilPertanyaan && (
                <motion.div
                  key="hasil"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      Hasil Pertanyaan
                    </h2>
                    {/* Statistik Jawaban */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {Object.entries(hasilPertanyaan.statistikJawaban).map(([jawaban, count]) => (
                        <div
                          key={jawaban}
                          className={`p-4 rounded-xl border-2 ${
                            jawaban === hasilPertanyaan.jawabanBenar
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {count} pemain
                          </div>
                          <div className="text-sm text-gray-600">{jawaban}</div>
                          {jawaban === hasilPertanyaan.jawabanBenar && (
                            <div className="text-green-600 font-semibold text-sm mt-1">✓ Benar</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Statistik & Pemain */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistik Tim */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-red-600 mr-2" />
                Statistik Tim
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Tim Merah */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-red-700">Tim Merah</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pemain:</span>
                      <span className="font-semibold">{statistikTim.merah.pemainCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Skor:</span>
                      <span className="font-semibold">{statistikTim.merah.totalSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rata-rata:</span>
                      <span className="font-semibold">{statistikTim.merah.rataRataSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jawaban Benar:</span>
                      <span className="font-semibold">{statistikTim.merah.jawabanBenar}</span>
                    </div>
                  </div>
                </div>

                {/* Tim Putih */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-semibold text-gray-700">Tim Putih</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pemain:</span>
                      <span className="font-semibold">{statistikTim.putih.pemainCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Skor:</span>
                      <span className="font-semibold">{statistikTim.putih.totalSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rata-rata:</span>
                      <span className="font-semibold">{statistikTim.putih.rataRataSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jawaban Benar:</span>
                      <span className="font-semibold">{statistikTim.putih.jawabanBenar}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pemenang */}
              {hasilPertanyaan && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">
                      Tim {hasilPertanyaan.pemenang === 'merah' ? 'Merah' : 'Putih'} Menang!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Daftar Pemain */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 text-red-600 mr-2" />
                Daftar Pemain ({pemain.filter(p => p.status === 'online').length} online)
              </h3>
              <div className="space-y-3">
                {pemain.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${p.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium text-gray-900">{p.nama}</span>
                    </div>
                    <span className="text-xs text-gray-500">{p.status}</span>
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