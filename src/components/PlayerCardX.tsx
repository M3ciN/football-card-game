"use client";

import React from "react";

/* 🔄 PlayerCardPanini — wersja z inteligentnym „rarity”
   ----------------------------------------------------
   • dynamiczne tło, kolor czcionek i obramowanie wybierane na podstawie rarity
   • fallback: jeśli przekazano backgroundUrl, ma pierwszeństwo nad rarity
*/

type Rarity = "laliga" | "common_gold" | "totw" | "icon" | "champs";

const rarityStyleMap: Record<Rarity, { bg: string; textColor: string; }> = {
  laliga: {
    bg: "/backgrounds/karta_bg_laliga.png",
    textColor: "text-gray-700",
    
  },
  common_gold: {
    bg: "/card-backgrounds/common_gold.png",
    textColor: "text-white",
    
  },
  totw: {
    bg: "/card-backgrounds/totw.png",
    textColor: "text-black",
    
  },
  icon: {
    bg: "/card-backgrounds/icon.png",
    textColor: "text-blue-100",
    
  },
  champs: {
    bg: "/backgrounds/karta_bg_champs.png",
    textColor: "text-cyan-200",
    
  },
};


export type PlayerCardProps = {
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
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
  scale?: number;
  rarity?: Rarity;
  className?: string;
  onClick?: () => void;
};

const PlayerCardPanini: React.FC<PlayerCardProps> = ({
  name,
  position,
  nationFlagUrl,
  clubLogoUrl,
  leagueLogoUrl,
  overall,
  level,
  stats,
  imageUrl,
  scale = 1,
  rarity = "laliga",
  className = "",
  onClick,
}) => {
  // Stałe w oryginalnych px dla 750x1050 karty
  const width = 750;
  const height = 1050;

  // styl wybrany na podstawie rarity
  const rarityStyle = rarityStyleMap[rarity];
  const effectiveBg = rarityStyle.bg;
  const textColor = rarityStyle.textColor;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        display: "inline-block",
      }}
      className={`relative select-none font-sans shadow-2xl rounded-lg ${className}`}
      onClick={onClick}
    >
      {/* Tło jako ramka */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          backgroundImage: `url(${effectiveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        
          zIndex: 0,
          aspectRatio: "220 / 320",
        }}
      />

      {/* Zdjęcie piłkarza i lewy panel */}
      <div
        className="relative flex justify-center pt-10 items-center overflow-hidden z-10"
        style={{ height: "644px" }}
      >
        <img
          src={imageUrl}
          alt={name}
          className="object-contain max-h-full max-w-full"
        />

        {/* Lewy górny panel z overall i pozycją */}
        <div
          className="absolute flex flex-col items-center gap-1 z-20"
          style={{ top: "60px", left: "24px" }}
        >
          <div
            className={`text-shadow rounded-md font-bold select-none text-center ${textColor}`}
            style={{
              width: "188px",
              padding: "10px 36px",
              fontSize: "72px",
              lineHeight: "1",
            }}
          >
            {overall}
          </div>
          <div
            className={`text-shadow rounded-md uppercase tracking-wide font-bold select-none text-center ${textColor}`}
            style={{
              width: "188px",
              padding: "0 36px",
              fontSize: "40px",
              lineHeight: "1",
            }}
          >
            {position}
          </div>
        </div>

        {/* Poziom (level) w prawym górnym rogu jako sześciokąt */}
        <div
          className="absolute top-[60px] right-[60px] z-20 flex items-center justify-center select-none font-semibold text-gray-800 shadow-md"
          style={{
            width: "88px",
            height: "80px",
            clipPath:
              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "88px",
              height: "80px",
              clipPath:
                "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
              backgroundColor: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              lineHeight: 1,
              userSelect: "none",
              fontWeight: 600,
            }}
          >
            {level}
          </div>
        </div>
      </div>

      {/* Sekcja informacji pod zdjęciem */}
      <div
        className="relative z-10 flex flex-col items-center text-center rounded-b-lg bg-transparent"
        style={{ padding: "10px 48px" }}
      >
        <h2
          className={`font-bold ${textColor}`}
          style={{ fontSize: "52px", marginBottom: "10px" }}
        >
          {name}
        </h2>

        {/* Statystyki */}
        <div
          className="flex justify-around w-full font-medium"
          style={{ fontSize: "36px", marginTop: "20px" }}
        >
          {(["DYN", "TEC", "INS"] as const).map((key) => (
            <div key={key} className={textColor}>
              <div className="font-bold">{key}</div>
              <div>{stats[key]}</div>
            </div>
          ))}
        </div>

        {/* Klub, liga i flaga */}
        <div
          className="flex justify-center items-center gap-20"
          style={{ marginTop: "20px" }}
        >
          <img
            src={clubLogoUrl}
            alt="club"
            style={{ width: "100px", height: "100px", objectFit: "contain" }}
          />
          <img
            src={leagueLogoUrl}
            alt="league"
            style={{ width: "100px", height: "100px", objectFit: "contain" }}
          />
          <img
            src={nationFlagUrl}
            alt="nation"
            style={{
              width: "100px",
              height: "84px",
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerCardPanini;
