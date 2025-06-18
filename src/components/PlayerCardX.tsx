"use client";

import React from "react";

type Rarity = "laliga" | "common_gold" | "totw" | "icon" | "champs";

const rarityStyleMap: Record<Rarity, { bg: string; textColor: string }> = {
  laliga:       { bg: "/backgrounds/karta_bg_laliga.png", textColor: "text-gray-700" },
  common_gold:  { bg: "/card-backgrounds/common_gold.png", textColor: "text-white" },
  totw:         { bg: "/card-backgrounds/totw.png",        textColor: "text-black" },
  icon:         { bg: "/card-backgrounds/icon.png",        textColor: "text-blue-100" },
  champs:       { bg: "/backgrounds/karta_bg_champs.png",  textColor: "text-cyan-200" },
};

export interface PlayerCardProps {
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  nationFlagUrl: string;
  clubLogoUrl: string;
  leagueLogoUrl: string;
  overall: number;
  level: number;
  stats: { DYN: number; TEC: number; INS: number };
  imageUrl: string;
  scale?: number;
  rarity?: Rarity;
  className?: string;
  onClick?: () => void;
  /** "full" – z nazwą i statystykami (domyślnie) | "compact" – tylko kluczowe elementy */
  variant?: "full" | "compact";
}

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
  variant = "full",
}) => {
  const width = 750;
  const height = 1050;

  const { bg: effectiveBg, textColor } = rarityStyleMap[rarity];
  const isCompact = variant === "compact";

  const logoSize = isCompact ? 140 : 100;
  const flagHeight = isCompact ? 120 : 84;

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
      {/* Tło */}
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

      {/* Zdjęcie + overall/position/level */}
      <div
        className="relative flex justify-center pt-10  overflow-hidden z-10"
        style={{ height: "644px" }}
      >
        <img
          src={imageUrl}
          alt={name}
          className="object-contain max-h-full max-w-full"
        />

        {/* Overall + Pozycja */}
        <div
          className="absolute flex flex-col items-center gap-1 z-20"
          style={{ top: "60px", left: "58px" }}
        >
          <div
            className={`font-bold select-none ${textColor}`}
            style={{ fontSize: "120px", lineHeight: 1, fontWeight: 800 }}
          >
            {overall}
          </div>
          <div
            className={`uppercase font-bold select-none ${textColor}`}
            style={{ fontSize: "68px", lineHeight: 1, fontWeight: 800 }}
          >
            {position}
          </div>
        </div>

        {/* Level */}
        <div
          className="absolute top-[60px] right-[60px] z-20 flex items-center justify-center select-none"
          style={{
            width: "88px",
            height: "80px",
            clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          }}
        >
          <div
            style={{
              width: "88px",
              height: "80px",
              backgroundColor: "rgba(255,255,255,0.8)",
              clipPath: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "68px",
              fontWeight: 600,
            }}
          >
            {level}
          </div>
        </div>
      </div>

      {/* Dolna sekcja */}
      <div className="relative z-10 flex flex-col items-center text-center" style={{ padding: "10px 48px" }}>
        {/* Nazwa zawodnika (tylko w pełnej wersji) */}
        {!isCompact && (
          <h2 className={`font-bold ${textColor}`} style={{ fontSize: "52px", marginBottom: "10px" }}>
            {name}
          </h2>
        )}

        {/* Statystyki (tylko w pełnej wersji) */}
        {!isCompact && (
          <div className="flex justify-around w-full font-medium" style={{ fontSize: "45px", fontWeight: 800, marginTop: "20px" }}>
            {(["DYN", "TEC", "INS"] as const).map((key) => (
              <div key={key} className={textColor}>
                <div className="font-bold">{key}</div>
                <div>{stats[key]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Logotypy */}
        <div className="flex justify-center items-center gap-14" style={{ marginTop: isCompact ? "100px" : "20px" }}>
          <img src={clubLogoUrl}   alt="club"   style={{ width: logoSize, height: logoSize, objectFit: "contain" }} />
          <img src={leagueLogoUrl} alt="league" style={{ width: logoSize, height: logoSize, objectFit: "contain" }} />
          <img src={nationFlagUrl} alt="nation" style={{ width: logoSize, height: flagHeight, objectFit: "contain", borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCardPanini;
