// src/app/page.tsx

'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/auth');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-4xl font-bold mb-4">Football Card Game</h1>
        <p className="mb-6 text-lg">Zbuduj swoją drużynę, otwieraj paczki i wygrywaj mecze!</p>
        <button
          onClick={handleStart}
          className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Rozpocznij grę
        </button>
      </div>
    </main>
  );
}
