'use client';

import SolarSystem from "../components/SolarSystem";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#232946] to-[#0b0c10] text-white relative">
      <div className="text-center font-bold tracking-wide mx-auto py-[2.22vh] text-[1.40625vw]">
        Our Journey Around the ☀️
      </div>
      {/* <div className="text-lg mb-8 text-blue-200">Celebrating our memories, one orbit at a time 💫</div> */}
      <SolarSystem />
      {/* <div className="mt-8 text-lg max-w-xl text-center m-auto">
        Hover over the purple dots to revisit our favorite moments.<br />
        More features coming soon!
      </div> */}
    </main >
  );
}
