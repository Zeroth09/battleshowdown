'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LobbyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/lomba');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
      <p className="text-gray-700">Mengalihkan ke halaman permainan real-time...</p>
    </div>
  );
} 