import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

type PositionGroup = "GK" | "DF" | "MF" | "FW";

const formationPositions: Record<PositionGroup, string[]> = {
  GK: ["GK"],
  DF: ["DF"],
  MF: ["MF"],
  FW: ["FW"]
};

const squadComposition: Record<PositionGroup, number> = {
  GK: 1,
  DF: 4,
  MF: 3,
  FW: 3
};

export const assignStarterSquad = async (userId: string) => {
  try {
    const allSelectedCards: { id: string; position: string }[] = [];

    for (const positionGroupKey of Object.keys(squadComposition)) {
      const positionGroup = positionGroupKey as PositionGroup;
      const count = squadComposition[positionGroup];
      const positions = formationPositions[positionGroup];

      let cardsForGroup: any[] = [];

      for (const pos of positions) {
        const q = query(
          collection(db, "cards"),
          where("position", "==", pos)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        cardsForGroup.push(...docs);
      }

      const uniqueCardsMap = new Map<string, any>();
      cardsForGroup.forEach(card => {
        if (!uniqueCardsMap.has(card.id)) uniqueCardsMap.set(card.id, card);
      });
      const uniqueCards = Array.from(uniqueCardsMap.values());

      if (uniqueCards.length < count) {
        throw new Error(`Za mało kart dla grupy ${positionGroup}. Wymagane: ${count}, dostępne: ${uniqueCards.length}`);
      }

      const shuffled = uniqueCards.sort(() => 0.5 - Math.random()).slice(0, count);
      allSelectedCards.push(...shuffled.map(card => ({ id: card.id, position: card.position })));
    }

    for (const card of allSelectedCards) {
      const userCardRef = doc(db, "users", userId, "userCards", card.id);
      await setDoc(userCardRef, {
        cardRef: doc(db, "cards", card.id),
        isInSquad: true,
        assignedPosition: card.position,
        acquiredAt: serverTimestamp()
      });
    }

    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, { formation: "4-3-3" }, { merge: true });

    console.log("✅ Losowe karty przypisane do składu.");
  } catch (error) {
    console.error("❌ Błąd assignStarterSquad:", error);
  }
};
