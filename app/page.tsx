'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [nama, setNama] = useState('');
  const [tim, setTim] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMasukGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !tim) {
      alert('Mohon isi nama dan pilih tim!');
      return;
    }

    setIsLoading(true);

    const pemainId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Simpan data pemain (kompatibilitas lama)
    localStorage.setItem('pemainData', JSON.stringify({
      nama: nama.trim(),
      tim,
      masukAt: new Date().toISOString()
    }));

    // Simpan data user untuk socket
    localStorage.setItem('user', JSON.stringify({
      pemainId,
      nama: nama.trim(),
      tim
    }));

    // Redirect ke halaman pemain (lobby real-time)
    router.push('/lomba');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-red-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            <span className="text-red-600">Battle</span> Showdown
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Game battle seru tanpa ribet! Masuk dengan nama, pilih tim, dan mulai bertarung!
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-red-100">
            <form onSubmit={handleMasukGame} className="space-y-6">
              {/* Nama Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Kamu
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400" />
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama kamu"
                    className="w-full pl-10 pr-4 py-3 border-2 border-red-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 bg-red-50/50"
                    required
                  />
                </div>
              </div>

              {/* Pilih Tim */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Tim
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTim('merah')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      tim === 'merah'
                        ? 'border-red-500 bg-red-500 text-white shadow-lg scale-105'
                        : 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-2"></div>
                      <span className="font-semibold">Tim Merah</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTim('putih')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      tim === 'putih'
                        ? 'border-gray-400 bg-gray-100 text-gray-800 shadow-lg scale-105'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-6 h-6 bg-gray-400 rounded-full mx-auto mb-2"></div>
                      <span className="font-semibold">Tim Putih</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !nama.trim() || !tim}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isLoading || !nama.trim() || !tim
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Masuk ke Game...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Masuk ke Battle!
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant Play</h3>
              <p className="text-gray-600 text-sm">Masuk langsung tanpa login, langsung main!</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Team Battle</h3>
              <p className="text-gray-600 text-sm">Bertarung dalam tim merah vs putih!</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time</h3>
              <p className="text-gray-600 text-sm">Jawab pertanyaan real-time dengan pemain lain!</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center text-gray-500"
        >
          <p className="text-sm">
            Game Master? <a href="/game-master" className="text-red-500 hover:text-red-600 font-semibold">Klik disini</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 