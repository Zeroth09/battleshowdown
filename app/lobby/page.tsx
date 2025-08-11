'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Trophy, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PemainData {
  nama: string;
  tim: string;
  masukAt: string;
}

interface Pertanyaan {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  waktu: number;
}

export default function LobbyPage() {
  const [pemainData, setPemainData] = useState<PemainData | null>(null);
  const [pemainLain, setPemainLain] = useState<PemainData[]>([]);
  const [status, setStatus] = useState<'menunggu' | 'pertanyaan' | 'hasil'>('menunggu');
  const [pertanyaan, setPertanyaan] = useState<Pertanyaan | null>(null);
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [jawabanDipilih, setJawabanDipilih] = useState<string | null>(null);
  const [hasil, setHasil] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Ambil data pemain dari localStorage
    const data = localStorage.getItem('pemainData');
    if (!data) {
      router.push('/');
      return;
    }

    const parsedData = JSON.parse(data);
    setPemainData(parsedData);

    const enableDummy = process.env.NEXT_PUBLIC_ENABLE_DUMMY === '1';
    if (enableDummy) {
      // Simulasi pemain lain (opsional untuk demo)
      setPemainLain([
        { nama: 'Budi', tim: 'merah', masukAt: new Date().toISOString() },
        { nama: 'Sari', tim: 'putih', masukAt: new Date().toISOString() },
        { nama: 'Rudi', tim: 'merah', masukAt: new Date().toISOString() },
        { nama: 'Dewi', tim: 'putih', masukAt: new Date().toISOString() },
      ]);

      // Simulasi pertanyaan dari game master (opsional untuk demo)
      setTimeout(() => {
        setPertanyaan({
          id: '1',
          pertanyaan: 'Apa ibukota Indonesia?',
          pilihan: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta'],
          waktu: 30
        });
        setStatus('pertanyaan');
        setWaktuTersisa(30);
      }, 5000);
    }
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'pertanyaan' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            // Waktu habis, tunjukkan hasil
            setStatus('hasil');
            setHasil({
              jawabanBenar: 'Jakarta',
              skorTim: { merah: 85, putih: 92 },
              pemenang: 'putih'
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, waktuTersisa]);

  const handleJawab = (jawaban: string) => {
    setJawabanDipilih(jawaban);
  };

  const handleLanjutkan = () => {
    // Reset untuk pertanyaan berikutnya
    setStatus('menunggu');
    setPertanyaan(null);
    setJawabanDipilih(null);
    setHasil(null);
    
    // Simulasi pertanyaan berikutnya
    setTimeout(() => {
      setPertanyaan({
        id: '2',
        pertanyaan: 'Berapa hasil dari 7 x 8?',
        pilihan: ['54', '56', '58', '60'],
        waktu: 25
      });
      setStatus('pertanyaan');
      setWaktuTersisa(25);
    }, 3000);
  };

  if (!pemainData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
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
                  {/* Timer */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-red-700 font-bold text-lg">
                        {waktuTersisa}s
                      </span>
                    </div>
                  </div>

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

              {status === 'hasil' && hasil && (
                <motion.div
                  key="hasil"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                      hasil.pemenang === pemainData.tim 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}>
                      {hasil.pemenang === pemainData.tim ? (
                        <Trophy className="w-10 h-10 text-white" />
                      ) : (
                        <AlertCircle className="w-10 h-10 text-white" />
                      )}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {hasil.pemenang === pemainData.tim ? 'Tim Kamu Menang! 🎉' : 'Tim Kamu Kalah 😔'}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-red-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-red-600">{hasil.skorTim.merah}</div>
                        <div className="text-sm text-red-700">Tim Merah</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-600">{hasil.skorTim.putih}</div>
                        <div className="text-sm text-gray-700">Tim Putih</div>
                      </div>
                    </div>

                    <button
                      onClick={handleLanjutkan}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
                    >
                      Lanjutkan ke Pertanyaan Berikutnya
                    </button>
                  </div>
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
                {pemainLain.map((pemain, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className={`w-3 h-3 rounded-full ${pemain.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-900">{pemain.nama}</span>
                  </motion.div>
                ))}
              </div>

              {/* Status Game */}
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-700">Status Game</span>
                </div>
                <div className="text-sm text-red-600">
                  {status === 'menunggu' && 'Menunggu pertanyaan dari Game Master'}
                  {status === 'pertanyaan' && 'Sedang menjawab pertanyaan'}
                  {status === 'hasil' && 'Menampilkan hasil'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 