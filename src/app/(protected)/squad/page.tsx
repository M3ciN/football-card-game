"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import PlayerCard from "@/components/PlayerCardX"; // Zakładam, że to poprawna ścieżka

type CardData = {
  id: string;
  name: string;
  position: string;
  nationFlagUrl: string;
  clubLogoUrl: string;
  leagueLogoUrl: string;
  overall: number;
  level: number;
  stats: {
    DYN: number;
    TEC: number;
    INS: number;
  };
  imageUrl: string;
  backgroundUrl?: string;
};

export default function SquadPage() {
  const { user } = useAuth();
  const [squad, setSquad] = useState<Record<string, string>>({});
  const [userCards, setUserCards] = useState<Record<string, CardData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Pobierz formację z dokumentu użytkownika
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const formation = userSnap.exists() ? userSnap.data().formation || {} : {};

        // Pobierz wszystkie karty gracza
        const cardsRef = collection(db, "users", user.uid, "userCards");
        const cardsSnap = await getDocs(cardsRef);

        const cards: Record<string, CardData> = {};
        cardsSnap.forEach((doc) => {
          cards[doc.id] = { id: doc.id, ...doc.data() } as CardData;
        });

        setSquad(formation);
        setUserCards(cards);
      } catch (err) {
        console.error("Błąd przy pobieraniu danych składu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const renderCard = (id?: string) => {
    if (!id || !userCards[id]) return <div className="w-[220px] h-[320px] bg-zinc-800 rounded-lg" />;
    const card = userCards[id];
    return (
      <PlayerCard
        key={id}
        {...card}
        position={card.position as "GK" | "DF" | "MF" | "FW"}
      />
    );
  };

  if (loading) {
    return <div className="text-white text-center mt-10">⏳ Ładowanie składu...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 p-6 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">📋 Twój skład (4-3-3)</h1>

      <div className="grid grid-rows-5 gap-6 items-center justify-center">
        {/* Atak */}
        <div className="flex justify-center gap-6">
          {renderCard(squad.FW1)}
          {renderCard(squad.FW2)}
          {renderCard(squad.FW3)}
        </div>

        {/* Pomocnicy */}
        <div className="flex justify-center gap-6">
          {renderCard(squad.MF1)}
          {renderCard(squad.MF2)}
          {renderCard(squad.MF3)}
        </div>

        {/* Obrońcy */}
        <div className="flex justify-center gap-6">
          {renderCard(squad.DF1)}
          {renderCard(squad.DF2)}
          {renderCard(squad.DF3)}
          {renderCard(squad.DF4)}
        </div>

        {/* Bramkarz */}
        <div className="flex justify-center">
          {renderCard(squad.GK)}
        </div>
      </div>
    </div>
  );
}
