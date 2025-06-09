'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Settings } from 'lucide-react';

const routes: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'Home' },
  { path: '/squad', label: 'Skład' },
  { path: '/shop', label: 'Sklep' },
  { path: '/club', label: 'Klub' },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    };
    fetchUserData();
  }, []);

  const currentRoute = routes.find(r => pathname.startsWith(r.path));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-40 bg-gray-800 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-6">⚽ Gra Karciana</h2>
        {routes.map(route => (
          <Link
            key={route.path}
            href={route.path}
            className={`py-2 px-4 rounded hover:bg-gray-700 mb-2 ${
              pathname.startsWith(route.path) ? 'bg-gray-700 font-bold' : ''
            }`}
          >
            {route.label}
          </Link>
        ))}
        <button
          onClick={async () => {
            await signOut(auth);
            window.location.href = '/auth';
          }}
          className="mt-auto py-2 px-4 bg-red-500 hover:bg-red-600 rounded"
        >
          Wyloguj się
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-18 bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            {currentRoute ? currentRoute.label : 'Panel'}
          </h1>
          {userData && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{userData.nickname} – {userData.teamName}</span>
              <span className="text-yellow-600 font-semibold">{userData.coins} 🪙</span>
              
            </div>
          )}
        </header>

        {/* Główna zawartość */}
        <main className="p-6 bg-gray-50 flex-1">{children}</main>
      </div>
    </div>
  );
}
