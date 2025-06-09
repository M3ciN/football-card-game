"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  updateDoc,
} from "firebase/firestore";
import PlayerCard from "@/components/PlayerCardX";
import { Dialog, Transition } from "@headlessui/react";

type Stats = { DYN: number; TEC: number; INS: number };

type Card = {
  id: string;
  name: string;
  position: string;
  overall: number;
  level: number;
  stats: Stats;
  clubId: string;
  leagueId: string;
  nationId: string;
  imageUrl: string;
  cardType?: string;
  rarity?: string;
  className?: string;

  // dodamy pola z logo (do wyświetlania)
  clubLogoUrl?: string;
  leagueLogoUrl?: string;
  nationFlagUrl?: string;
};

const PAGE_SIZE = 16;

export default function ClubPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Card | null>(null);

  // Mapy id -> logoUrl / flagUrl
  const [clubsMap, setClubsMap] = useState<Record<string, string>>({});
  const [leaguesMap, setLeaguesMap] = useState<Record<string, string>>({});
  const [nationsMap, setNationsMap] = useState<Record<string, string>>({});

  // ---- auth ----
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/auth");
      else setUser(u);
    });
    return () => unsub();
  }, []);

  // ---- fetch clubs, leagues, nations ----
  useEffect(() => {
    const fetchData = async () => {
      const [clubsSnap, leaguesSnap, nationsSnap] = await Promise.all([
        getDocs(collection(db, "clubs")),
        getDocs(collection(db, "leagues")),
        getDocs(collection(db, "nations")),
      ]);

      const clubs: Record<string, string> = {};
      clubsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.logoUrl) clubs[doc.id] = data.logoUrl;
      });
      setClubsMap(clubs);

      const leagues: Record<string, string> = {};
      leaguesSnap.forEach((doc) => {
        const data = doc.data();
        if (data.logoUrl) leagues[doc.id] = data.logoUrl;
      });
      setLeaguesMap(leagues);

      const nations: Record<string, string> = {};
      nationsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.flagUrl) nations[doc.id] = data.flagUrl;
      });
      setNationsMap(nations);
    };

    fetchData();
  }, []);

  // ---- fetch user cards + dołącz logo ----
  useEffect(() => {
    const fetchCards = async () => {
      if (!user) return;
      setLoading(true);
      const snap = await getDocs(collection(db, `users/${user.uid}/userCards`));
      const list = snap.docs.map((d) => {
        const data = d.data() as Card;
        return {
          ...data,
          clubLogoUrl: clubsMap[data.clubId] || "",
          leagueLogoUrl: leaguesMap[data.leagueId] || "",
          nationFlagUrl: nationsMap[data.nationId] || "",
        };
      });
      setCards(list);
      setLoading(false);
    };

    // Odśwież po załadowaniu map
    if (user && Object.keys(clubsMap).length > 0 && Object.keys(leaguesMap).length > 0 && Object.keys(nationsMap).length > 0) {
      fetchCards();
    }
  }, [user, clubsMap, leaguesMap, nationsMap]);

  // ---- sortowanie ----
  const sorted = [...cards].sort((a, b) =>
    sortAsc ? a.overall - b.overall : b.overall - a.overall
  );

  // ---- paginacja ----
  const maxPage = Math.max(0, Math.ceil(sorted.length / PAGE_SIZE) - 1);
  const pageCards = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // ---- sprzedaż ----
  const handleSell = async () => {
    if (!user || !selected) return;
    await deleteDoc(doc(db, `users/${user.uid}/userCards`, selected.id));
    await updateDoc(doc(db, "users", user.uid), {
      coins: increment(selected.overall * 10),
    });
    setCards((prev) => prev.filter((c) => c.id !== selected.id));
    setSelected(null);
  };

  // ---- render ----
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Ładowanie…
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">🏟️ Twój klub</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setSortAsc((s) => !s)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded"
            >
              {sortAsc ? "⇧ Najwyższy OVR" : "⇩ Najniższy OVR"}
            </button>
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="bg-zinc-700 hover:bg-zinc-600 px-2 rounded disabled:opacity-40"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="bg-zinc-700 hover:bg-zinc-600 px-2 rounded disabled:opacity-40"
            >
              ‹
            </button>
            <span className="self-center px-2">
              {page + 1}/{maxPage + 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page === maxPage}
              className="bg-zinc-700 hover:bg-zinc-600 px-2 rounded disabled:opacity-40"
            >
              ›
            </button>
            <button
              onClick={() => setPage(maxPage)}
              disabled={page === maxPage}
              className="bg-zinc-700 hover:bg-zinc-600 px-2 rounded disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>

        {pageCards.length === 0 ? (
          <p className="text-zinc-400">Brak kart.</p>
        ) : (
          <div className="grid grid-cols-4 grid-rows-4 gap-4">
            {pageCards.map((c) => (
              <div
                key={c.id}
                className="w-[160px] h-[240px] flex items-center justify-center bg-zinc-800 rounded shadow-inner hover:brightness-110 transition cursor-pointer"
                onClick={() => setSelected(c)}
              >
                <div className="transform scale-[0.23] origin-center">
                  <PlayerCard
                    {...c}
                    nationFlagUrl={c.nationFlagUrl ?? ""}
                    clubLogoUrl={c.clubLogoUrl ?? ""}
                    leagueLogoUrl={c.leagueLogoUrl ?? ""}
                    position={c.position as "GK" | "DF" | "MF" | "FW"}
                    rarity={c.rarity as any} // or as Rarity if imported
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Transition show={!!selected} as={Fragment}>
        <Dialog onClose={() => setSelected(null)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto max-w-md w-full">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-2 text-sm">
                    <button
                      onClick={handleSell}
                      className="bg-red-600 hover:bg-red-700 py-2 px-6 rounded text-white"
                    >
                      💰 Sprzedaj
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded text-white"
                    >
                      ↩︎ Wróć
                    </button>
                  </div>

                  {selected && (
                    <div className="w-[290px] h-[440px]">
                      <PlayerCard 
                      scale={0.45}
                      {...selected}
                      nationFlagUrl={selected.nationFlagUrl ?? ""}
                      clubLogoUrl={selected.clubLogoUrl ?? ""}
                      leagueLogoUrl={selected.leagueLogoUrl ?? ""}
                      position={selected.position as "GK" | "DF" | "MF" | "FW"}
                      rarity={selected.rarity as any} />
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
