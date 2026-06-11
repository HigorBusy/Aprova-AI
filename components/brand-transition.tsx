"use client";

import Image from "next/image";

export function BrandTransition({ label = "Sincronizando sua missÃ£o" }: { label?: string }) {
  return (
    <div className="brand-transition fixed inset-0 z-[100] grid place-items-center bg-canvas px-6">
      <div className="brand-transition-mark text-center">
        <Image
          src="/aprova-ai-glow.png"
          alt="AprovaAI"
          width={720}
          height={300}
          priority
          className="mx-auto h-auto w-[min(82vw,620px)] object-contain"
        />
        <p className="brand-transition-label mt-3 text-xs font-medium uppercase tracking-[0.24em] text-aura">
          {label}
        </p>
      </div>
    </div>
  );
}
