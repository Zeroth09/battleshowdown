'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Trophy, X, CheckCircle, XCircle, Play, Home } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '../../components/ErrorBoundary';

// Dynamic import SocketManager dengan error handling
const SocketManager = dynamic(() => import('../../components/SocketManager'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
      Menghubungkan ke server...
    </div>
  )
});

interface User {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
  lokasi?: {
    latitude: number;
    longitude: number;
  };
}

interface Battle {
  id: string;
  pertanyaan: string;
  pilihanJawaban: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  jawabanBenar: string;
  lawan: {
    nama: string;
    tim: string;
  };
}

const LombaPageContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleStatus, setBattleStatus] = useState<string>('Menunggu Pertanyaan');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [resultType, setResultType] = useState<'win' | 'lose' | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const socketManagerRef = useRef<any>(null);
  const [socketManagerReady, setSocketManagerReady] = useState<boolean>(false);
  const router = useRouter();

  // Load user data from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } else {
        // Redirect to home if no user data
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/');
      return;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleSocketReady = () => {
    setSocketManagerReady(true);
    setIsConnected(true);
  };

  const handleLobbyUpdate = (data: { players: User[], count: number }) => {
    setLobbyPlayers(data.players);
  };

  const handleBattleStart = useCallback((battleData: Battle) => {
    try {
      console.log('🎯 Battle started for participant:', battleData);
      setActiveBattle(battleData);
      setBattleStatus('Pertanyaan Aktif!');
      setSelectedAnswer('');
      setIsAnswering(false);
      setShowResult(false);
      setResultMessage('');
      setResultType('');
      setError('');
    } catch (error) {
      console.error('Error in handleBattleStart:', error);
      setError('Error memulai battle');
    }
  }, []);

  const handleBattleEnd = useCallback((result: any) => {
    try {
      console.log('🏁 Battle ended for participant:', result);
      
      if (result && result.pemenang) {
        const isWinner = result.pemenang.pemainId === user?.pemainId;
        const isCorrect = result.jawabanBenar === result.jawabanPeserta;
        
        if (isWinner && isCorrect) {
          setResultMessage('🏆 LANJUTKAN PERJALANAN!');
          setResultType('win');
        } else if (isWinner && !isCorrect) {
          setResultMessage('💔 ULANGI DARI AWAL!');
          setResultType('lose');
        } else {
          setResultMessage('💔 ULANGI DARI AWAL!');
          setResultType('lose');
        }
      }
      
      setShowResult(true);
      setBattleStatus('Menunggu Pertanyaan');
      
      // Auto clear after 5 seconds
      setTimeout(() => {
        setActiveBattle(null);
        setShowResult(false);
        setResultMessage('');
        setResultType('');
      }, 5000);
    } catch (error) {
      console.error('Error in handleBattleEnd:', error);
      setError('Error mengakhiri battle');
    }
  }, [user]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!user || !activeBattle || isAnswering) return;
    
    try {
      setIsAnswering(true);
      setSelectedAnswer(answer);
      
      if (socketManagerRef.current) {
        await socketManagerRef.current.submitAnswer(activeBattle.id, answer);
      }
      
      setBattleStatus('Jawaban Terkirim!');
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Gagal mengirim jawaban');
      setSelectedAnswer('');
    } finally {
      setIsAnswering(false);
    }
  }, [user, activeBattle, isAnswering]);

  const handleBackToHome = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Memuat game...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>User tidak ditemukan</p>
          <button 
            onClick={handleBackToHome}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                user.tim === 'merah' ? 'bg-red-500' : 'bg-gray-300'
              }`}>
                <span className={`font-bold text-lg ${
                  user.tim === 'merah' ? 'text-white' : 'text-gray-800'
                }`}>
                  {user.nama.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{user.nama}</h1>
                <p className={`text-sm ${
                  user.tim === 'merah' ? 'text-red-300' : 'text-gray-300'
                }`}>
                  Tim {user.tim}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                isConnected ? 'bg-green-500/20 text-green-300 border border-green-400' : 'bg-red-500/20 text-red-300 border border-red-400'
              }`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
              
              <button
                onClick={handleBackToHome}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Game Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Battle Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Play className="w-6 h-6 mr-3 text-blue-400" />
                  Status Game
                </h2>
                <div className={`px-4 py-2 rounded-lg font-medium ${
                  activeBattle 
                    ? 'bg-green-500/20 text-green-300 border border-green-400' 
                    : 'bg-gray-500/20 text-gray-300 border border-gray-400'
                }`}>
                  {battleStatus}
                </div>
              </div>

              {activeBattle ? (
                <div className="space-y-6">
                  {/* Question */}
                  <div className="p-6 bg-white/10 rounded-xl">
                    <h3 className="text-xl font-semibold text-white mb-4">Pertanyaan:</h3>
                    <p className="text-gray-200 text-lg mb-6">{activeBattle.pertanyaan}</p>
                    
                    {/* Answer Options */}
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(activeBattle.pilihanJawaban).map(([key, value]) => (
                        <motion.button
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSubmitAnswer(key)}
                          disabled={isAnswering || selectedAnswer !== ''}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedAnswer === key
                              ? 'border-blue-400 bg-blue-500/30 shadow-lg'
                              : 'border-white/30 bg-white/10 hover:bg-white/20'
                          } ${
                            isAnswering || selectedAnswer !== '' ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              selectedAnswer === key ? 'bg-blue-500' : 'bg-white/20'
                            }`}>
                              <span className={`font-bold ${
                                selectedAnswer === key ? 'text-white' : 'text-gray-300'
                              }`}>
                                {key.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-white font-medium">{value}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Result */}
                  {showResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-xl border-2 ${
                        resultType === 'win' 
                          ? 'border-green-400 bg-green-500/20' 
                          : 'border-red-400 bg-red-500/20'
                      }`}
                    >
                      <div className="text-center">
                        {resultType === 'win' ? (
                          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        ) : (
                          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        )}
                        <h3 className={`text-2xl font-bold mb-2 ${
                          resultType === 'win' ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {resultMessage}
                        </h3>
                        <p className="text-gray-300">
                          {resultType === 'win' 
                            ? 'Selamat! Kamu berhasil menjawab dengan benar!' 
                            : 'Jangan menyerah! Coba lagi pertanyaan berikutnya!'
                          }
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Play className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Menunggu Pertanyaan</h3>
                  <p className="text-gray-400 text-lg">Game Master akan memulai pertanyaan segera</p>
                  <p className="text-gray-500 text-sm mt-2">Pastikan kamu sudah terhubung ke server</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-lg">
                  <p className="text-red-200 text-center">{error}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Player List */}
          <div className="space-y-6">
            
            {/* Player Count */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Peserta Online
              </h2>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{lobbyPlayers.length}</div>
                <p className="text-gray-300 text-sm">Peserta aktif</p>
              </div>
            </motion.div>

            {/* Player List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Daftar Peserta
              </h2>

              {lobbyPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Belum ada peserta</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lobbyPlayers.map((player, index) => (
                    <motion.div
                      key={player.pemainId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border-2 ${
                        player.tim === 'merah' 
                          ? 'bg-red-500/20 border-red-400' 
                          : 'bg-gray-500/20 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          player.tim === 'merah' ? 'bg-red-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <p className={`font-semibold ${
                            player.tim === 'merah' ? 'text-red-200' : 'text-gray-200'
                          }`}>
                            {player.nama}
                          </p>
                          <p className="text-gray-400 text-xs">Tim {player.tim}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Socket Manager */}
      {user && (
        <SocketManager
          ref={socketManagerRef}
          user={user}
          onReady={handleSocketReady}
          onBattleStart={handleBattleStart}
          onBattleEnd={handleBattleEnd}
          onLobbyUpdate={handleLobbyUpdate}
          role="player"
        />
      )}
    </div>
  );
};

const LombaPage = () => {
  return (
    <ErrorBoundary>
      <LombaPageContent />
    </ErrorBoundary>
  );
};

export default LombaPage; 