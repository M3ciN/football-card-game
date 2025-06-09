"use client";

import { useMotionValue, useTransform, motion } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

type PlayerData = {
  id: string;
  name: string;
  overall: number;
  position: "GK" | "DEF" | "MID" | "ATT" | "ST";
  dynamika: number;
  technika: number;
  instynkt: number;
  imageUrl: string;
  flagUrl: string;
  clubLogoUrl: string;
  number: number;
  skill?: string;
};

type GoldCardProps = {
  player: PlayerData;
  width?: number;
  height?: number;
};

export default function GoldPlayerCard({
  player,
  width = 320,
  height = 400,
}: GoldCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    x.set(mouseX - centerX);
    y.set(mouseY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{
        width,
        height,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Tło karty */}
      <Image
        src="/backgrounds/72_heroes.png"
        alt="Gold Background"
        layout="fill"
        objectFit="cover"
        className="z-0"
        priority
      />

      {/* Skaluje całe wnętrze proporcjonalnie */}
      <motion.div
  className="absolute inset-0 z-10 origin-top-left"
  style={{
    scale: width / 320,
  }}
>
  <div className="relative w-[320px] h-[400px] flex flex-col justify-between px-6 pt-6 pb-6 text-yellow-200 font-bold">
    {/* Zdjęcie zawodnika wyśrodkowane, niezależne od reszty */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
      <Image
        src={player.imageUrl}
        alt={player.name}
        width={500}
        height={400}
        className="object-contain drop-shadow-2xl scale-180"
      />
    </div>

    {/* Górne informacje */}
    <div className="px-8 pt-14 pb-12 relative z-10 flex justify-between w-full text-[1em]">
      <div>
        <div className="text-[2em] leading-none">{player.overall}</div>
        <div className="text-[1em] mt-1">{player.position}</div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <Image src={player.clubLogoUrl} alt="Club" width={36} height={36} />
        <Image src={player.flagUrl} alt="Flag" width={36} height={20} />
      </div>
    </div>

    {/* Imię */}
    <div className="pt-16 relative z-10 text-lg text-center mt-2">{player.name}</div>

    {/* Statystyki */}
    <div className="pb-4 px-8 relative z-10 mt-2 grid grid-cols-3 gap-3 text-center text-sm w-full">
      <div>
        <div className="text-gray-300 text-xs">DYN</div>
        <div className="text-lg font-semibold">{player.dynamika}</div>
      </div>
      <div>
        <div className="text-gray-300 text-xs">TEC</div>
        <div className="text-lg font-semibold">{player.technika}</div>
      </div>
      <div>
        <div className="text-gray-300 text-xs">INS</div>
        <div className="text-lg font-semibold">{player.instynkt}</div>
      </div>
    </div>
  </div>
</motion.div>
    </motion.div>
  );
}
