'use client';

import { ReactNode, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

  if (!userData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Ładowanie danych użytkownika...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar
        nickname={userData.nickname}
        teamName={userData.teamName}
        coins={userData.coins}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
