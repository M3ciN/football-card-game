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
    {top:"90%",left:"50%"},
    {top:"72%",left:"15%"},{top:"72%",left:"32%"},{top:"72%",left:"68%"},{top:"72%",left:"85%"},
    {top:"48%",left:"18%"},{top:"48%",left:"35%"},{top:"48%",left:"65%"},{top:"48%",left:"82%"},
    {top:"20%",left:"38%"},{top:"20%",left:"62%"},
  ],
  "4-3-3":[
    {top:"90%",left:"50%"},
    {top:"72%",left:"15%"},{top:"72%",left:"32%"},{top:"72%",left:"68%"},{top:"72%",left:"85%"},
    {top:"48%",left:"28%"},{top:"48%",left:"50%"},{top:"48%",left:"72%"},
    {top:"20%",left:"15%"},{top:"20%",left:"50%"},{top:"20%",left:"85%"},
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
  const [formation,setFormation]= useState<FormationKey>("4-4-2");
  const [squad,setSquad]        = useState<(Card|null)[]>(FORMATIONS["4-4-2"].map(()=>null));
  const [loading,setLoading]    = useState(true);

  const [clubsMap,setClubs]     = useState<Record<string,string>>({});
  const [leaguesMap,setLeagues] = useState<Record<string,string>>({});
  const [nationsMap,setNations] = useState<Record<string,string>>({});

  const [activeIdx,setActiveIdx]= useState<number|null>(null);
  const [selectIdx,setSelectIdx]= useState<number|null>(null); // modal wyboru

  /* ---------- auth ---------- */
  useEffect(()=>{const unsub=onAuthStateChanged(auth,u=>{u?setUser(u):router.push("/auth")});return unsub;},[]);

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
    })();
  },[user,clubsMap,leaguesMap,nationsMap,formation]);

  /* ---------- zapisz ---------- */
  const save=(arr:(Card|null)[])=>{
    if(!user) return;
    const data:Record<number,string>={}; arr.forEach((c,i)=>c&&(data[i]=c.id));
    updateDoc(doc(db,"users",user.uid),{squad:data});
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
    <div className="flex h-[85vh] bg-green-800 text-white overflow-hidden">
      {/* ==== LEWO: BOISKO ==== */}
      <div className="flex-1 flex flex-col items-center p-4 overflow-y-auto">
        <h1 className="text-2xl mb-3">Formacja {formation}</h1>
        <select value={formation} onChange={e=>setFormation(e.target.value as FormationKey)}
                className="mb-5 px-2 py-1 rounded text-black">
          {Object.keys(FORMATIONS).map(f=> <option key={f}>{f}</option> )}
        </select>

        <div className="relative w-full max-w-3xl h-[60vh] bg-green-900 rounded-lg border-4 border-green-700 overflow-hidden">
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
                className="absolute w-16 h-24 -translate-x-1/2 -translate-y-1/2"
                style={{top:pos.top,left:pos.left}}
                onClick={()=>setActiveIdx(idx)}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>onDropSlot(e,idx)}
                title={card?card.name:`Pozycja ${slotPos}`}
              >
                {card ? (
<div
  draggable
  onDragStart={e => onDragStart(e, idx)}
  className="w-16 h-24 cursor-pointer"
>
  <div className="w-full h-full pointer-events-none">
    <PlayerCard {...card} scale={0.1} />
  </div>
</div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-green-700/80 border border-green-500 rounded-lg text-2xl">+</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==== PRAWY SIDEBAR ==== */}
      <aside className="w-50 h-screen bg-gray-100 text-gray-900 p-6 flex flex-col">
        {activeIdx===null && (
          <p className="text-center text-gray-500 mt-20">Kliknij slot, by zobaczyć szczegóły</p>
        )}

        {activeIdx!==null && squad[activeIdx]===null && (
          <div className="flex-1 flex flex-col items-center  gap-4">
            <div className="text-6xl text-gray-400">+</div>
            <p>Pusta pozycja ({FORMATIONS[formation][activeIdx]})</p>
            <button
              onClick={()=>setSelectIdx(activeIdx)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Dodaj kartę
            </button>
          </div>
        )}

  {activeIdx !== null && squad[activeIdx] && (
    <div className="flex flex-col justify-between flex-1">
      <div className="flex flex-col  gap-4">
              <button
        className="bg-red-600 hover:bg-red-700 py-2 text-white rounded w-full mt-4"
        onClick={() => remove(activeIdx)}
      >
        Usuń z drużyny
      </button>
        <h2 className="text-xl font-bold text-center">{squad[activeIdx]!.name}</h2>
        <PlayerCard {...squad[activeIdx]!} scale={0.20} />
        
      </div>
    </div>
        )}
      </aside>

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
          <PlayerCard {...c} scale={0.12} />
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
