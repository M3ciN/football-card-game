'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Settings } from 'lucide-react';



export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth');
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        router.push('/setup');
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  if (!userData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Ładowanie profilu gracza...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Górny pasek */}
      <header className="bg-blue-600 shadow flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">{userData.nickname}</h1>
          <p className="text-sm text-gray-600">{userData.teamName}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-yellow-600">{userData.coins} 🪙</span>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              <Settings className="w-6 h-6 text-gray-700 hover:text-gray-900" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Wyloguj się
                </button>
                {/* Przyszłe: ustawienia konta */}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Panel główny */}
      <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-w-5xl mx-auto w-full">
        {/* Zagraj mecz */}
        <div
          className="bg-gray-400 p-6 rounded-xl shadow-md cursor-pointer hover:bg-blue-100 transition"
          onClick={() => alert('Zagraj mecz')}
        >
          <h2 className="text-xl font-bold mb-2">🎮 Zagraj mecz</h2>
          <p className="text-sm text-gray-600">Wejdź na boisko i zmierz się z rywalem!</p>
        </div>

        {/* Sklep */}
        <div
          className="bg-blue-400 p-6 rounded-xl shadow-md cursor-pointer hover:bg-green-100 transition"
          onClick={() => alert('Przejdź do sklepu')}
        >
          <h2 className="text-xl font-bold mb-2">🛒 Sklep</h2>
          <p className="text-sm text-gray-600">Kup paczki i ulepsz swój zespół.</p>
        </div>

        {/* Skład – większy panel */}
        <div
          className="md:col-span-2 bg-green-400 p-6 rounded-xl shadow-md cursor-pointer hover:bg-purple-100 transition"
          onClick={() => router.push('/squad')}
        >
          <h2 className="text-2xl font-bold mb-2">🧩 Twój Skład</h2>
          <p className="text-sm text-gray-600">Zarządzaj piłkarzami i ustawieniem drużyny.</p>
        </div>

        {/* Klub */}
        <div
          className="bg-gray-400 p-6 rounded-xl shadow-md cursor-pointer hover:bg-blue-100 transition"
          onClick={() => router.push('/club')}
        >
          <h2 className="text-xl font-bold mb-2">🎮 Klub</h2>
          <p className="text-sm text-gray-600">Zarządzaj swoim klubem.</p>
        </div>
      </section>
    </main>
  );
}
