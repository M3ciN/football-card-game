"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function SetupProfilePage() {
  const [nickname, setNickname] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else router.push("/auth"); // Jeśli nie ma użytkownika, wróć do logowania
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      await setDoc(doc(db, "users", userId), {
        nickname,
        teamName,
        coins: 1000,
        createdAt: new Date(),
      });

      router.push("/starter-pack"); // 👈 Przejście do otwarcia paczki
    } catch (err) {
      console.error("Błąd przy tworzeniu profilu:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-800 p-6 rounded-lg w-full max-w-md space-y-4 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center">Uzupełnij profil</h1>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nick"
          className="w-full p-2 rounded text-black"
          required
        />
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Nazwa drużyny"
          className="w-full p-2 rounded text-black"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded"
        >
          {loading ? "Zapisuję..." : "Zapisz i przejdź dalej"}
        </button>
      </form>
    </div>
  );
}
