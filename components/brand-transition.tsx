"use client";

import { Loader } from "@/components/ui/loader-15";

export function BrandTransition() {
  return (
    <div className="brand-transition fixed inset-0 z-[100] grid place-items-center bg-canvas px-6">
      <Loader size="lg" />
    </div>
  );
}
