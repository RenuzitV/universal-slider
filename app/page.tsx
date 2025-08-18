'use client';

import dynamic from "next/dynamic";
const SolarSystem = dynamic(() => import("../components/SolarSystem"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#232946] to-[#0b0c10] text-white relative">
      <div className="text-4xl font-bold mb-2 tracking-wide m-auto py-8">Our Journey Around the ☀️</div>
      {/* <div className="text-lg mb-8 text-blue-200">Celebrating our memories, one orbit at a time 💫</div> */}
      <SolarSystem />
      {/* <div className="mt-8 text-lg max-w-xl text-center m-auto">
        Hover over the purple dots to revisit our favorite moments.<br />
        More features coming soon!
      </div> */}
    </main >
  );
}
