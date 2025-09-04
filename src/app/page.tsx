"use client";

import TestAMM from "./TestAMM";
import TestDLMM from "./TestDLMM";

// import { getQuote } from "./functions";
import Test from "./Test";
// import Swap from "./Swap";
// import Test from "./Test";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* <Swap /> */}
      {/* <Test /> */}
      <TestAMM />
      {/* <TestDLMM /> */}
    </div>
  );
}
