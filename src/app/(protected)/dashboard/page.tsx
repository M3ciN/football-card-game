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
