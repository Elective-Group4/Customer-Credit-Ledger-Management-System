import React, { useState, useEffect } from "react";

const StoreLoader = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 1. Start fading out at 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // 2. Completely remove the component at 3 seconds
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="Loading Storefront"
    >
      {/* Main Stage / Floor (overflow-hidden hides the store before it pops up) */}
      <div className="relative w-80 h-64 flex flex-col items-center justify-end border-b-4 border-stone-800 pb-0 overflow-hidden">
        {/* 1. The Building Base (Shoots up from below the ground) */}
        {/* Notice 'animate-rise-up' is applied here! */}
        <div className="relative w-56 h-40 bg-orange-50 border-4 border-stone-800 border-b-0 rounded-t-xl flex justify-around items-end opacity-0 animate-rise-up [animation-delay:100ms]">
          {/* 2. Awning (Rolls down from top) */}
          <div className="absolute -top-1 -left-3 -right-3 h-14 flex opacity-0 origin-top animate-roll-down [animation-delay:800ms] z-20">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full rounded-b-full border-4 border-stone-800 border-t-0 ${i % 2 === 0 ? "bg-red-500" : "bg-white"}`}
              />
            ))}
          </div>

          {/* Side Decor: Potted Plant (Shoots up right after the building) */}
          <div className="absolute bottom-0 -left-12 flex flex-col items-center opacity-0 animate-rise-up [animation-delay:400ms]">
            <div className="w-8 h-8 bg-green-400 rounded-full border-4 border-stone-800 relative z-10 translate-y-2" />
            <div className="w-10 h-8 bg-orange-700 border-4 border-stone-800 rounded-b-lg" />
          </div>

          {/* Store Window */}
          <div className="w-20 h-24 bg-sky-100 border-4 border-stone-800 rounded-md mb-6 relative overflow-hidden flex flex-col items-center shadow-inner">
            {/* Glass reflection line */}
            <div className="absolute -inset-2 bg-white/50 rotate-45 transform -translate-x-6 translate-y-2 w-8 h-32 z-0" />

            {/* 4. Open Sign (Swings down from window top) */}
            <div className="absolute top-2 w-12 h-6 bg-yellow-400 border-2 border-stone-800 flex items-center justify-center opacity-0 origin-top animate-swing [animation-delay:1800ms] shadow-sm z-10">
              <span className="text-[10px] font-black text-stone-800">
                OPEN
              </span>
            </div>
          </div>

          {/* 3. Store Door Wrapper (perspective for 3D flip effect) */}
          <div className="w-16 h-28 mb-0 relative [perspective:800px]">
            {/* Empty Door Frame / Inside of shop */}
            <div className="absolute inset-0 bg-stone-300 border-4 border-stone-800 border-b-0 rounded-t-md shadow-inner" />

            {/* The Actual Door (Swings open) */}
            <div className="absolute inset-0 bg-orange-200 border-4 border-stone-800 border-b-0 rounded-t-md origin-left animate-door-open [animation-delay:1300ms] flex justify-end items-center pr-2 z-10">
              {/* Door handle */}
              <div className="w-2 h-2 rounded-full bg-stone-800" />
            </div>
          </div>
        </div>

        {/* 5. Delivery Box (Slides across the screen repeatedly) */}
        <div className="absolute bottom-0 left-0 w-10 h-10 bg-amber-600 border-4 border-stone-800 rounded-sm opacity-0 animate-slide-box [animation-delay:2200ms] z-30 flex items-center justify-center">
          {/* Box Packaging Tape */}
          <div className="w-full h-2 bg-amber-300 border-y-2 border-stone-800/20" />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-10 flex flex-col items-center">
        <h2 className="text-xl font-bold text-stone-800 tracking-widest uppercase">
          Preparing Shop
        </h2>
        {/* Bouncing Dots */}
        <div className="flex space-x-2 mt-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" />
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:-150ms]" />
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:-300ms]" />
        </div>
      </div>
    </div>
  );
};

export default StoreLoader;
