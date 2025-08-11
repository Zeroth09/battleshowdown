'use client';

import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface LiveAnswer {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
  jawaban: string;
  waktu: Date;
}

interface SocketManagerProps {
  user: User;
  onReady?: () => void;
  onBattleStart?: (battleData: Battle) => void;
  onBattleEnd?: (result: any) => void;
  onLiveAnswer?: (answerData: LiveAnswer) => void;
  onLobbyUpdate?: (data: any) => void;
  onSpectatorUpdate?: (data: any) => void;
}

export interface SocketManagerRef {
  socket: Socket | null;
  submitAnswer: (battleId: string, answer: string) => Promise<void>;
  joinLobby: () => void;
  leaveLobby: () => void;
  joinSpectator: () => void;
}

const SocketManager = forwardRef<SocketManagerRef, SocketManagerProps>(
  ({ user, onReady, onBattleStart, onBattleEnd, onLiveAnswer, onLobbyUpdate, onSpectatorUpdate }, ref) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [maxRetries] = useState(5);

    // Initialize socket connection with retry logic
    const initializeSocket = useCallback(() => {
      try {
        const primaryUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://battleshowdownback-production.up.railway.app';
        const fallbackUrls = [
          'https://battleshowdownback-production.up.railway.app',
          'https://battleshowdown-production.up.railway.app'
        ];
        const candidateUrls = [primaryUrl, ...fallbackUrls].filter((v, i, arr) => !!v && arr.indexOf(v) === i);
        const backendUrl = candidateUrls[0];
        
        console.log('🔌 Attempting to connect to:', backendUrl);
        
        const newSocket = io(backendUrl, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true,
        });

        // Connection events
        newSocket.on('connect', () => {
          console.log('🔌 Connected to server successfully');
          setIsConnected(true);
          setConnectionAttempts(0);
          
          // Send user data to server
          newSocket.emit('join-lobby', {
            pemainId: user.pemainId,
            nama: user.nama,
            tim: user.tim,
            lokasi: user.lokasi
          });
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from server:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          setIsConnected(false);
          
          // Retry connection if under max attempts
          if (connectionAttempts < maxRetries) {
            setConnectionAttempts(prev => prev + 1);
            console.log(`🔄 Retrying connection... Attempt ${connectionAttempts + 1}/${maxRetries}`);
            
            setTimeout(() => {
              if (newSocket.disconnected) {
                // Try next URL fallback if available by re-instantiating socket
                const nextIndex = (connectionAttempts + 1) % candidateUrls.length;
                const nextUrl = candidateUrls[nextIndex];
                if (nextUrl && nextUrl !== backendUrl) {
                  console.log('🔄 Recreating Socket.IO client with endpoint:', nextUrl);
                  try {
                    newSocket.removeAllListeners();
                    newSocket.close();
                  } catch (_) {}
                  const replacement = io(nextUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    forceNew: true,
                  });
                  setSocket(replacement);
                  replacement.connect();
                  return;
                }
                newSocket.connect();
              }
            }, 2000);
          } else {
            console.error('❌ Max connection attempts reached');
          }
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          setConnectionAttempts(0);
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('❌ Reconnection error:', error);
        });

        // Battle events
        newSocket.on('battle-start', (battleData: Battle) => {
          console.log('⚔️ Battle started:', battleData);
          try {
            onBattleStart?.(battleData);
          } catch (error) {
            console.error('Error in battle-start handler:', error);
          }
        });

        newSocket.on('battle-selesai', (result: any) => {
          console.log('🏁 Battle finished:', result);
          try {
            onBattleEnd?.(result);
          } catch (error) {
            console.error('Error in battle-selesai handler:', error);
          }
        });

        // Battle cancellation events
        newSocket.on('battle-dibatalkan', (data: any) => {
          console.log('❌ Battle cancelled:', data);
          try {
            window.dispatchEvent(new CustomEvent('battle-dibatalkan', { detail: data }));
          } catch (error) {
            console.error('Error in battle-dibatalkan handler:', error);
          }
        });

        newSocket.on('battle-error', (data: any) => {
          console.log('❌ Battle error:', data);
          try {
            window.dispatchEvent(new CustomEvent('battle-error', { detail: data }));
          } catch (error) {
            console.error('Error in battle-error handler:', error);
          }
        });

        // Global battle events (Game Master)
        newSocket.on('global-battle-start', (data: any) => {
          console.log('👑 Global battle started:', data);
          try {
            onBattleStart?.(data.battleData);
          } catch (error) {
            console.error('Error in global-battle-start handler:', error);
          }
        });

        newSocket.on('global-battle-end', (data: any) => {
          console.log('👑 Global battle ended:', data);
          try {
            onBattleEnd?.(data.result);
          } catch (error) {
            console.error('Error in global-battle-end handler:', error);
          }
        });

        // Live answer events (Spectator)
        newSocket.on('live-answer', (answerData: LiveAnswer) => {
          console.log('👁️ Live answer received:', answerData);
          try {
            onLiveAnswer?.(answerData);
          } catch (error) {
            console.error('Error in live-answer handler:', error);
          }
        });

        // Lobby events
        newSocket.on('lobby-update', (data: any) => {
          console.log('👥 Lobby updated:', data);
          try {
            onLobbyUpdate?.(data);
          } catch (error) {
            console.error('Error in lobby-update handler:', error);
          }
        });

        // Spectator events
        newSocket.on('spectator-update', (data: any) => {
          console.log('👁️ Spectator update:', data);
          try {
            onSpectatorUpdate?.(data);
          } catch (error) {
            console.error('Error in spectator-update handler:', error);
          }
        });

        setSocket(newSocket);

        // Call onReady immediately on connect
        if (onReady) {
          try {
            onReady();
          } catch (error) {
            console.error('Error in onReady callback:', error);
          }
        }

        return () => {
          console.log('🧹 Cleaning up socket connection');
          newSocket.close();
        };
      } catch (error) {
        console.error('❌ Error initializing socket:', error);
        return () => {};
      }
    }, [user, onReady, onBattleStart, onBattleEnd, onLiveAnswer, connectionAttempts, maxRetries, isConnected]);

    // Initialize socket on mount
    useEffect(() => {
      const cleanup = initializeSocket();
      return cleanup;
    }, [initializeSocket]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      socket,
      submitAnswer: async (battleId: string, answer: string) => {
        if (!socket || !socket.connected) {
          throw new Error('Socket not connected');
        }
        
        return new Promise<void>((resolve, reject) => {
          try {
            socket.emit('jawab-battle', {
              battleId,
              jawaban: answer,
              pemainId: user.pemainId,
              nama: user.nama,
              tim: user.tim
            }, (response: any) => {
              if (response && response.success) {
                console.log('✅ Answer submitted successfully');
                resolve();
              } else {
                const errorMsg = response?.error || 'Unknown error';
                console.error('❌ Failed to submit answer:', errorMsg);
                reject(new Error(errorMsg));
              }
            });
          } catch (error) {
            console.error('❌ Error in submitAnswer:', error);
            reject(error);
          }
        });
      },
      joinLobby: () => {
        if (socket && socket.connected) {
          try {
            socket.emit('join-lobby', {
              pemainId: user.pemainId,
              nama: user.nama,
              tim: user.tim,
              lokasi: user.lokasi
            });
          } catch (error) {
            console.error('Error joining lobby:', error);
          }
        }
      },
      leaveLobby: () => {
        if (socket && socket.connected) {
          try {
            socket.emit('leave-lobby', {
              pemainId: user.pemainId
            });
          } catch (error) {
            console.error('Error leaving lobby:', error);
          }
        }
      },
      joinSpectator: () => {
        if (socket && socket.connected) {
          try {
            socket.emit('join-spectator', {
              spectatorId: user.pemainId,
              nama: user.nama
            });
          } catch (error) {
            console.error('Error joining spectator:', error);
          }
        }
      }
    }), [socket, user]);

    // Expose socket globally for fallback
    useEffect(() => {
      if (socket && socket.connected) {
        try {
          (window as any).socket = {
            submitAnswer: async (battleId: string, answer: string) => {
              if (!socket || !socket.connected) throw new Error('Socket not connected');
              
              return new Promise<void>((resolve, reject) => {
                try {
                  socket.emit('jawab-battle', {
                    battleId,
                    jawaban: answer,
                    pemainId: user.pemainId,
                    nama: user.nama,
                    tim: user.tim
                  }, (response: any) => {
                    if (response && response.success) {
                      resolve();
                    } else {
                      reject(new Error(response?.error || 'Unknown error'));
                    }
                  });
                } catch (error) {
                  reject(error);
                }
              });
            }
          };
        } catch (error) {
          console.error('Error exposing socket to window:', error);
        }
      }
    }, [socket, user]);

    return null; // This component doesn't render anything
  }
);

SocketManager.displayName = 'SocketManager';

export default SocketManager; 