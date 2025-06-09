"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import PlayerCard from "@/components/PlayerCardX";

type PlayerCardData = {
  id: string;
  name: string;
  position: string;
  overall: number;
  level: number;
  stats: {
    DYN: number;
    TEC: number;
    INS: number;
  };
  clubLogoUrl: string;
  leagueLogoUrl: string;
  nationFlagUrl: string;
  imageUrl: string;
  backgroundUrl?: string;
};

export default function StarterPackPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<PlayerCardData[]>([]);
  const [opened, setOpened] = useState(false);
  const router = useRouter();

  // Sprawdzenie zalogowania
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else router.push("/auth");
    });

    return () => unsubscribe();
  }, []);

  // Pobieranie kart i losowanie paczki
  const openPack = async () => {
    const snapshot = await getDocs(collection(db, "cards"));
    const allCards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PlayerCardData[];

    const getRandom = (arr: PlayerCardData[], count: number) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, count);

    const GK = getRandom(allCards.filter((c) => c.position === "GK"), 1);
    const DF = getRandom(allCards.filter((c) => c.position === "DF"), 4);
    const MF = getRandom(allCards.filter((c) => c.position === "MF"), 3);
    const FW = getRandom(allCards.filter((c) => c.position === "FW" || c.position === "ST"), 3);

    setCards([...GK, ...DF, ...MF, ...FW]);
    setOpened(true);
  };

  // Dodawanie kart do użytkownika
  const addToClub = async () => {
    if (!userId) return;

    const batch = cards.map((card) => {
      const ref = doc(db, `users/${userId}/userCards`, card.id);
      return setDoc(ref, card);
    });

    await Promise.all(batch);
    router.push("/dashboard"); // lub "/team" lub inna strona składu
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🎁 Paczka startowa</h1>

      {!opened ? (
        <div className="flex justify-center">
          <button
            onClick={openPack}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg text-xl"
          >
            Otwórz paczkę
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
            {cards.map((card) => (
              <PlayerCard
                key={card.id}
                name={card.name}
                position={card.position}
                overall={card.overall}
                level={card.level}
                stats={card.stats}
                clubLogoUrl={card.clubLogoUrl}
                leagueLogoUrl={card.leagueLogoUrl}
                nationFlagUrl={card.nationFlagUrl}
                imageUrl={card.imageUrl}
                backgroundUrl={card.backgroundUrl}
              />
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={addToClub}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-xl"
            >
              ✅ Dodaj do klubu
            </button>
          </div>
        </>
      )}
    </div>
  );
}
