'use client';

import SolarSystem from "../components/SolarSystem";
import ToastProvider from "../components/ToastProvider";

export default function Home() {
  return (
    <ToastProvider>
      <main className="h-[100dvh] flex flex-col bg-gradient-to-b from-[#232946] to-[#0b0c10] text-white overflow-hidden">
        <h1 className="shrink-0 text-center font-bold tracking-wide mx-auto py-[2.22vh] text-[1.40625vw]">
          Our Journey Around the ☀️
        </h1>

        {/* This wrapper gets the remaining height */}
        <div className="flex-1 min-h-0">
          <SolarSystem />
        </div>
      </main>
    </ToastProvider>
  );
}

