"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import PlayerCard from "@/components/PlayerCardX";
import { Dialog, Transition } from "@headlessui/react";

/* ---------- typy ---------- */
type Stats = { DYN: number; TEC: number; INS: number };
type Card = {
  id: string; name: string; position: string; overall: number; level: number;
  stats: Stats; clubId: string; leagueId: string; nationId: string; imageUrl: string;
  clubLogoUrl?: string; leagueLogoUrl?: string; nationFlagUrl?: string; rarity?: string;
};
type FormationKey = "4-4-2" | "4-3-3" | "3-5-2";

/* ---------- formacje ---------- */
const FORMATIONS: Record<FormationKey, string[]> = {
  "4-4-2": ["GK","DF","DF","DF","DF","MF","MF","MF","MF","FW","FW"],
  "4-3-3": ["GK","DF","DF","DF","DF","MF","MF","MF","FW","FW","FW"],
  "3-5-2": ["GK","DF","DF","DF","MF","MF","MF","MF","MF","FW","FW"],
};

/* ---------- układ slotów (%, względem kontenera boiska) ---------- */
const FORMATION_POSITIONS: Record<FormationKey,{top:string;left:string}[]> = {
  "4-4-2":[
    {top:"85%",left:"50%"},
    {top:"70%",left:"15%"},{top:"70%",left:"32%"},{top:"70%",left:"68%"},{top:"70%",left:"85%"},
    {top:"42%",left:"18%"},{top:"42%",left:"35%"},{top:"42%",left:"65%"},{top:"42%",left:"82%"},
    {top:"15%",left:"38%"},{top:"15%",left:"62%"},
  ],
  "4-3-3":[
    {top:"85%",left:"50%"},
    {top:"70%",left:"12%"},{top:"72%",left:"32%"},{top:"72%",left:"68%"},{top:"70%",left:"88%"},
    {top:"42%",left:"28%"},{top:"42%",left:"50%"},{top:"42%",left:"72%"},
    {top:"15%",left:"15%"},{top:"15%",left:"50%"},{top:"15%",left:"85%"},
  ],
  "3-5-2":[
    {top:"90%",left:"50%"},
    {top:"72%",left:"28%"},{top:"72%",left:"50%"},{top:"72%",left:"72%"},
    {top:"55%",left:"10%"},{top:"55%",left:"30%"},{top:"55%",left:"50%"},{top:"55%",left:"70%"},{top:"55%",left:"90%"},
    {top:"20%",left:"38%"},{top:"20%",left:"62%"},
  ],
};

export default function SquadPage() {
  const router = useRouter();
  const [user,setUser]          = useState<User|null>(null);
  const [allCards,setAllCards]  = useState<Card[]>([]);
  const [formation,setFormation]= useState<FormationKey>("4-3-3");
  const [squad,setSquad]        = useState<(Card|null)[]>(FORMATIONS["4-4-2"].map(()=>null));
  const [loading,setLoading]    = useState(true);

  const [clubsMap,setClubs]     = useState<Record<string,string>>({});
  const [leaguesMap,setLeagues] = useState<Record<string,string>>({});
  const [nationsMap,setNations] = useState<Record<string,string>>({});

  const [activeIdx,setActiveIdx]= useState<number|null>(null);
  const [selectIdx,setSelectIdx]= useState<number|null>(null); // modal wyboru
const [showSellConfirm, setShowSellConfirm] = useState(false);
const [chemistryArray, setChemistryArray] = useState<number[]>([]);
const [totalChemistry, setTotalChemistry] = useState<number>(0);



  /* ---------- auth ---------- */
  useEffect(()=>{const unsub=onAuthStateChanged(auth,u=>{u?setUser(u):router.push("/auth")});return unsub;},[]);

  /* ---------- pobierz formację z bazy (jeśli ustawiona) ---------- */
  useEffect(() => {
  if (!user) return;

  (async () => {
    const uDoc = await getDoc(doc(db, "users", user.uid));
    if (uDoc.exists()) {
      const savedFormation = uDoc.data().formation as FormationKey | undefined;
      if (savedFormation && savedFormation in FORMATIONS) {
        setFormation(savedFormation);
      }
    }
  })();
}, [user]);

  /* ---------- pobierz logo/flag ---------- */
  useEffect(()=>{
    (async()=>{
      const [c,l,n]=await Promise.all([
        getDocs(collection(db,"clubs")),getDocs(collection(db,"leagues")),getDocs(collection(db,"nations"))
      ]);
      const map=(snap:any,k:string)=>{const m:Record<string,string>={};snap.forEach((d:any)=>k in d.data()&&(m[d.id]=d.data()[k]));return m;};
      setClubs(map(c,"logoUrl")); setLeagues(map(l,"logoUrl")); setNations(map(n,"flagUrl"));
    })();
  },[]);

  /* ---------- pobierz karty + squad ---------- */
  useEffect(()=>{
    if(!user || !Object.keys(clubsMap).length) return;
    (async()=>{
      setLoading(true);
      const snap=await getDocs(collection(db,`users/${user.uid}/userCards`));
      const cards=snap.docs.map(d=>({...(d.data() as Card),
        clubLogoUrl:clubsMap[d.data().clubId]||"", leagueLogoUrl:leaguesMap[d.data().leagueId]||"", nationFlagUrl:nationsMap[d.data().nationId]||""
      }));
      setAllCards(cards);
      const uDoc=await getDoc(doc(db,"users",user.uid));
      const saved=uDoc.exists()?uDoc.data().squad as Record<number,string>|undefined:undefined;
      const byId=cards.reduce<Record<string,Card>>((a,c)=>{a[c.id]=c;return a;}, {});
      setSquad(FORMATIONS[formation].map((_,i)=>saved&&saved[i]?byId[saved[i]]||null:null));
      setLoading(false);

const squadCards = FORMATIONS[formation].map((_, i) => saved && saved[i] ? byId[saved[i]] || null : null);
setSquad(squadCards);

const { chemistryArray, totalChemistry } = calculateChemistry(squadCards, formation);
setChemistryArray(chemistryArray);
setTotalChemistry(totalChemistry);

    })();
  },[user,clubsMap,leaguesMap,nationsMap,formation]);

  useEffect(() => {
  const { chemistryArray, totalChemistry } = calculateChemistry(squad, formation);
  setChemistryArray(chemistryArray);
  setTotalChemistry(totalChemistry);
}, [squad, formation]);

  /* ---------- zapisz ---------- */
  const save=(arr:(Card|null)[])=>{
    if(!user) return;
    const data:Record<number,string>={}; arr.forEach((c,i)=>c&&(data[i]=c.id));
    updateDoc(doc(db,"users",user.uid),{squad:data});
  };

  /* ---------- zapis formacji ---------- */
  const handleFormationChange = async (newFormation: FormationKey) => {
  setFormation(newFormation);

  if (user) {
    await updateDoc(doc(db, "users", user.uid), { formation: newFormation });
  }
};

  /* ---------- zgranie ---------- */
const calculateChemistry = (squad: (Card | null)[], formationKey: FormationKey): { chemistryArray: number[]; totalChemistry: number } => {
  const positions = FORMATIONS[formationKey]; // lista pozycji z formacji (np. ["GK", "CB", "CB", ...])

  const chemistryArray = squad.map((card, idx) => {
    if (!card) return 0;

    const positionInFormation = positions[idx];
    const isCorrectPosition = card.position === positionInFormation;

    if (!isCorrectPosition) return 0; // zgranie tylko jeśli pozycja się zgadza

    let chemistry = 0;
    squad.forEach((otherCard, otherIdx) => {
      if (!otherCard || idx === otherIdx) return;
      if (card.clubId === otherCard.clubId) chemistry++;
      if (card.leagueId === otherCard.leagueId) chemistry++;
      if (card.nationId === otherCard.nationId) chemistry++;
    });

    return Math.min(chemistry, 3);
  });

  const totalChemistry = chemistryArray.reduce((sum, val) => sum + val, 0);
  return { chemistryArray, totalChemistry };
};


  /* ---------- pomocnicze ---------- */
  const moveCard=(from:number,to:number)=>{
    const next=[...squad];
    const temp=next[from];
    next[from]=next[to];
    next[to]=temp;
    setSquad(next); save(next);
  };
  const assign=(idx:number,c:Card)=>{const n=[...squad];n[idx]=c;setSquad(n);save(n);};
  const remove=(idx:number)=>{const n=[...squad];n[idx]=null;setSquad(n);save(n);setActiveIdx(null);};

  /* ---------- drag handlers ---------- */
  const onDragStart=(e:React.DragEvent,idx:number)=>{
    e.dataTransfer.setData("text/plain",String(idx));
  };
  const onDropSlot=(e:React.DragEvent,target:number)=>{
    const from=parseInt(e.dataTransfer.getData("text/plain"),10);
    if(Number.isNaN(from)) return;
    if(from===target) return;
    moveCard(from,target);
  };

  /* ---------- selectable cards dla modalu ---------- */
  const selectable=selectIdx!==null
    ? allCards.filter(c=>c.position===FORMATIONS[formation][selectIdx])
    : [];

  if(loading) return <div className="text-white p-6">Ładowanie…</div>;

  return (
    <div className="flex h-[88vh] bg-green-800 text-white overflow-hidden">
      {/* ==== LEWO: BOISKO ==== */}
      <div className="flex-1 flex flex-col items-center p-4 overflow-y-auto">
        <h1 className="text-2xl mb-3">Formacja {formation}</h1>
<select
  value={formation}
  onChange={e => handleFormationChange(e.target.value as FormationKey)}
  className="mb-5 px-2 py-1 rounded text-black"
>
  {Object.keys(FORMATIONS).map(f => (
    <option key={f}>{f}</option>
  ))}
</select>
<h2 className="text-lg font-bold mb-2">Zgranie drużyny: {totalChemistry}/33</h2>


        <div className="relative w-full max-w-3xl h-[68vh] bg-green-900 rounded-lg border-4 border-green-700 overflow-hidden">
          {/* linie */}
          <div className="absolute inset-0 border border-green-600 rounded-lg"/>
          <div className="absolute top-1/2 left-0 w-full border-t border-green-600"/>
          <div className="absolute top-[17%] left-0 w-full border-t border-green-600"/>
          <div className="absolute top-[83%] left-0 w-full border-t border-green-600"/>

          {/* sloty */}
          {squad.map((card,idx)=>{
            const pos=FORMATION_POSITIONS[formation][idx];
            const slotPos=FORMATIONS[formation][idx];

return (
  <div
    key={idx}
    className="absolute w-20 h-32 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
    style={{ top: pos.top, left: pos.left }}
    onClick={() => setActiveIdx(idx)}
    onDragOver={e => e.preventDefault()}
    onDrop={e => onDropSlot(e, idx)}
    title={card ? card.name : `Pozycja ${slotPos}`}
  >
    {/* karta lub '+' */}
    {card ? (
      <div
        draggable
        onDragStart={e => onDragStart(e, idx)}
        className="w-full h-28 cursor-pointer"
      >
        <div className="w-full h-full pointer-events-none">
          <PlayerCard {...card} scale={0.1} variant="compact" />
        </div>
      </div>
    ) : (
      <div className="w-full h-28 flex items-center justify-center bg-green-700/80 border border-green-500 rounded-lg text-2xl">
        +
      </div>
    )}

    {/* podpis pozycji */}
    <div
      className={`
        mt-1 px-2 py-0.5 rounded text-sm font-semibold text-center  
        ${card?.position === slotPos ? "bg-green-500 text-white" : "bg-green-600 text-orange-700"}
      `}
      style={{ minWidth: "50%" }}
    >
      {slotPos} {chemistryArray[idx] ?? 0}
    </div>
  </div>
);

          })}
        </div>
      </div>

{/* ==== PRAWY SIDEBAR ==== */}
<aside className="w-54 h-screen bg-gray-100 text-gray-900 p-6 flex flex-col border-l border-gray-300">
  {/* ───── BRAK WYBRANEGO SLOTA ───── */}
  {activeIdx === null && (
    <p className="text-center text-gray-500 mt-20">
      Kliknij slot, by zobaczyć szczegóły
    </p>
  )}

  {/* ───── PUSTY SLOT ───── */}
  {activeIdx !== null && squad[activeIdx] === null && (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="text-6xl text-gray-400">+</div>
      <p>Pusta pozycja ({FORMATIONS[formation][activeIdx]})</p>
      <button
        onClick={() => setSelectIdx(activeIdx)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Dodaj kartę
      </button>
    </div>
  )}

  {/* ───── KARTA W SLOcie ───── */}
  {activeIdx !== null && squad[activeIdx] && (
    <>
      {/* Nazwa karty nad kartą */}
      <h2 className="text-xl font-semibold mb-2 text-center">
        {squad[activeIdx]!.name}
      </h2>

      {/* Główna karta */}
      <div className="relative h-[250px] items-center justify-center mb-2 overflow-hidden">
        <PlayerCard {...squad[activeIdx]!} scale={0.22} variant="full" />
      </div>

      {/* Pozycja pod kartą */}
      <p
        className={`text-center font-medium mb-6 ${
          squad[activeIdx]!.position === FORMATIONS[formation][activeIdx]
            ? "text-green-600"
            : "text-orange-600"
        }`}
      >
        Pozycja: {FORMATIONS[formation][activeIdx]}
      </p>

      {/* Przyciski akcji */}
      <div className="border rounded-lg overflow-hidden shadow-sm divide-y divide-gray-300">
        <button
          className="w-full text-left px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium"
          onClick={() => {/* Dodaj modal szczegółów */}}
        >
          Dane zawodnika
        </button>

        <button
          className="w-full text-left px-4 py-3 bg-white hover:bg-blue-50 text-blue-700 font-medium"
          onClick={() => setSelectIdx(activeIdx)}
        >
          Wymień zawodnika
        </button>

        <button
          className="w-full text-left px-4 py-3 bg-white hover:bg-yellow-50 text-yellow-700 font-medium"
          onClick={() => remove(activeIdx)}
        >
          Wyślij do klubu
        </button>

        <button
          className="w-full text-left px-4 py-3 bg-white hover:bg-red-50 text-red-700 font-medium"
          onClick={() => setShowSellConfirm(true)}
        >
          Sprzedaj
        </button>
      </div>
    </>
  )}
</aside>


{/* ===== MODAL POTWIERDZENIA SPRZEDAŻY ===== */}
<Transition show={showSellConfirm} as={Fragment}>
  <Dialog as="div" className="relative z-50" onClose={() => setShowSellConfirm(false)}>
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black/70" />
    </Transition.Child>

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-sm">
        <Dialog.Title className="text-lg font-semibold mb-4">
          Na pewno chcesz sprzedać tę kartę?
        </Dialog.Title>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={() => setShowSellConfirm(false)}
          >
            Anuluj
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              if (activeIdx !== null) {
                // ➡️ tu możesz dodać logikę dodania monet
                remove(activeIdx);   // usuwa kartę ze składu
              }
              setShowSellConfirm(false);
            }}
          >
            Tak, sprzedaj
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
</Transition>


      {/* ==== MODAL WYBORU ==== */}
      <Transition show={selectIdx!==null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={()=>setSelectIdx(null)}>
          <Transition.Child as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150"  leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/70"/>
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Wybierz zawodnika ({selectIdx!==null && FORMATIONS[formation][selectIdx]})
              </h3>

              {selectable.length === 0 ||
 selectable.filter(c => !squad.some(player => player?.id === c.id)).length === 0 ? (
  <p>Brak kart na tę pozycję.</p>
) : (
  <div className="grid grid-cols-3 gap-4">
    {selectable
      .filter(c => !squad.some(player => player?.id === c.id))
      .map(c => (
        <div
          key={c.id}
          className="cursor-pointer hover:scale-105 transform transition-transform"
          onClick={() => {
            assign(selectIdx!, c);
            setSelectIdx(null);
          }}
        >
          <PlayerCard {...c} scale={0.13} />
        </div>
      ))}
  </div>
)}


              <button
                className="mt-4 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                onClick={()=>setSelectIdx(null)}
              >
                Anuluj
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
