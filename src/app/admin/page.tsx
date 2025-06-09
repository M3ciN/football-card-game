'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth');
      } else {
        const docRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(docRef);

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser(currentUser);
        } else {
          router.push('/dashboard');
        }

        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  if (loading) return <p className="text-center mt-10">Ładowanie...</p>;

  return (
    <div className="min-h-screen bg-yellow-50 p-8">
      <div className="max-w-xl mx-auto bg-white shadow rounded p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel Administratora</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1 rounded">
            Wyloguj
          </button>
        </div>
        <p className="mt-4">Tutaj możesz zarządzać grą: użytkownikami, kartami, logami itp.</p>
      </div>
    </div>
  );
}
