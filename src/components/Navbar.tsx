'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Navbar({
  nickname,
  teamName,
  coins,
}: {
  nickname: string;
  teamName: string;
  coins: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  return (
    <header className="bg-blue-600 shadow flex justify-between items-center px-6 py-4">
      <div>
        <h1 className="text-xl font-bold text-white">{nickname}</h1>
        <p className="text-sm text-blue-200">{teamName}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-yellow-300">{coins} 🪙</span>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            <Settings className="w-6 h-6 text-white hover:text-yellow-200" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Wyloguj się
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
