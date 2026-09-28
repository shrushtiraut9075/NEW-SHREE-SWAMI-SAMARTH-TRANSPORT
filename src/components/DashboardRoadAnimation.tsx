import React, { useState, useEffect } from 'react';
import { Sun, Moon, Volume2, Truck, Navigation, Gauge } from 'lucide-react';

interface DashboardRoadAnimationProps {
  companyName?: string;
  tagline?: string;
}

export const DashboardRoadAnimation: React.FC<DashboardRoadAnimationProps> = ({
  companyName = 'NEW SHREE SWAMI SAMARTH TRANSPORT',
  tagline = 'चाकण, पुणे • ALL INDIA PERMIT',
}) => {
  const [isNight, setIsNight] = useState(true);
  const [speed, setSpeed] = useState<'NORMAL' | 'EXPRESS' | 'SUPER'>('EXPRESS');
  const [distanceKm, setDistanceKm] = useState(148);
  const [hornActive, setHornActive] = useState(false);

  // Speed multiplier for animations
  const speedSeconds = speed === 'NORMAL' ? '1.4s' : speed === 'EXPRESS' ? '0.7s' : '0.4s';
  const wheelSeconds = speed === 'NORMAL' ? '0.8s' : speed === 'EXPRESS' ? '0.45s' : '0.25s';

  // Incremental live odometer simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setDistanceKm((prev) => prev + 1);
    }, speed === 'NORMAL' ? 4000 : speed === 'EXPRESS' ? 2200 : 1200);
    return () => clearInterval(interval);
  }, [speed]);

  // Dual-tone Indian Truck Horn synthesizer via Web Audio API
  const playTruckHorn = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      setHornActive(true);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Indian truck musical horn dual chord (approx 440Hz & 554Hz)
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(554, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.65);
      osc2.stop(ctx.currentTime + 0.65);

      setTimeout(() => setHornActive(false), 650);
    } catch {
      setHornActive(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-xl select-none my-3 sm:my-4 w-full max-w-full min-w-0">
      {/* Atmosphere / Sky */}
      <div
        className={`relative transition-colors duration-700 ${
          isNight
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100'
            : 'bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100 text-slate-900'
        } pt-3 sm:pt-4 pb-1 px-3 sm:px-6`}
      >
        {/* Top Control Bar inside Dashboard Highway */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 relative z-20 mb-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] font-bold backdrop-blur-xs text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>LIVE FLEET RUN (चाकण हायवे)</span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono hidden sm:inline-block">
              Expressway: Pune - Nashik NH-60 • Chakan MIDC Hub
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-lg p-0.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setSpeed('NORMAL')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  speed === 'NORMAL' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                40 km/h
              </button>
              <button
                type="button"
                onClick={() => setSpeed('EXPRESS')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  speed === 'EXPRESS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                80 km/h
              </button>
              <button
                type="button"
                onClick={() => setSpeed('SUPER')}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  speed === 'SUPER' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                120 km/h
              </button>
            </div>

            {/* Day / Night Toggle */}
            <button
              type="button"
              onClick={() => setIsNight(!isNight)}
              title={isNight ? 'Switch to Day Drive' : 'Switch to Night Drive'}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-amber-200 transition cursor-pointer"
            >
              {isNight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Horn Button */}
            <button
              type="button"
              onClick={playTruckHorn}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer border ${
                hornActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 scale-95'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-500/50'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>HORN OK PLEASE</span>
            </button>
          </div>
        </div>

        {/* Sky Background Horizon, Stars or Mountains */}
        <div className="relative h-20 sm:h-24 w-full overflow-hidden flex items-end">
          {/* Subtle Skyline / Industrial silhouettes in distance */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between opacity-30 pointer-events-none">
            {/* Mountain / hill shapes */}
            <svg viewBox="0 0 1200 120" className="w-full h-16 fill-current text-slate-800 preserve-3d">
              <path d="M0,120 L0,70 Q150,30 300,75 T600,60 T900,80 Q1050,40 1200,65 L1200,120 Z" />
            </svg>
          </div>

          {/* Roadside Electric Poles / Lamp Silhouette */}
          <div className="absolute inset-x-0 bottom-0 h-16 flex justify-around opacity-25 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-0.5 h-14 bg-slate-400"></div>
                <div className="w-4 h-0.5 bg-slate-400 -mt-12"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_#f59e0b]"></div>
              </div>
            ))}
          </div>

          {/* Odometer & Highway Marker Tag */}
          <div className="absolute right-4 bottom-2 z-10 flex items-center gap-2 bg-slate-950/70 border border-slate-700/80 px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-400 backdrop-blur-xs">
            <Gauge className="w-3 h-3 text-emerald-400" />
            <span>TRIP: <strong>{distanceKm} KM</strong></span>
            <span className="text-slate-500">|</span>
            <Navigation className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300">PUNE-NASHIK EXP</span>
          </div>

          {/* Milestone Stone on side of road */}
          <div className="absolute left-6 sm:left-12 bottom-1 z-10 bg-yellow-400 text-slate-950 border-2 border-slate-900 rounded-t-lg px-2 py-0.5 text-center font-bold text-[9px] shadow-md">
            <div className="border-b border-slate-900/40 text-[8px] uppercase tracking-wider font-black">
              NH-60
            </div>
            <div>चाकण</div>
            <div className="text-[8px] font-mono">0 KM</div>
          </div>
        </div>

        {/* ================= ROAD SECTION ================= */}
        <div className="relative w-full bg-slate-900 border-t-2 border-slate-700 shadow-inner">
          {/* Top Road Shoulder / Curb (Yellow & Black stripes) */}
          <div
            className="h-1.5 w-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 12px, #0f172a 12px, #0f172a 24px)',
            }}
          />

          {/* Asphalt Surface */}
          <div className="relative h-24 sm:h-28 w-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center overflow-hidden">
            {/* Animated Center Road Dashed Lines */}
            <div
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 w-full pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(to right, #facc15 0px, #facc15 35px, transparent 35px, transparent 75px)',
                backgroundSize: '120px 100%',
                animation: `roadLaneMove ${speedSeconds} linear infinite`,
              }}
            />

            {/* Secondary White Lane Marker */}
            <div
              className="absolute inset-x-0 bottom-2.5 h-0.5 w-full pointer-events-none opacity-40"
              style={{
                backgroundImage: 'repeating-linear-gradient(to right, #ffffff 0px, #ffffff 20px, transparent 20px, transparent 40px)',
                backgroundSize: '80px 100%',
                animation: `roadLaneMove ${speedSeconds} linear infinite`,
              }}
            />

            {/* ================= THE HEAVY TRANSPORT TRUCK ================= */}
            <div
              className="relative z-10 flex items-center"
              style={{
                animation: 'truckBounce 0.35s ease-in-out infinite',
              }}
            >
              {/* Exhaust Smoke Animation Behind Truck */}
              <div className="absolute -left-6 bottom-4 flex flex-col items-center pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500/60 blur-xs animate-exhaust" />
                <span
                  className="w-3.5 h-3.5 rounded-full bg-slate-400/40 blur-xs animate-exhaust"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>

              {/* Truck SVG Container */}
              <div className="relative flex items-center filter drop-shadow-[0_10px_8px_rgba(0,0,0,0.6)]">
                {/* 1. Large Cargo Container Body */}
                <div className="relative bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-400 rounded-l-md px-3 sm:px-5 py-2.5 shadow-2xl flex flex-col justify-between h-16 sm:h-20 w-56 sm:w-80">
                  {/* Container Top Metal Corrugation Lines */}
                  <div className="absolute inset-x-2 top-1 flex justify-between opacity-30">
                    {[...Array(14)].map((_, i) => (
                      <span key={i} className="w-0.5 h-full bg-amber-200" />
                    ))}
                  </div>

                  {/* Header Badge */}
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-amber-200 tracking-wider">
                    <span className="bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-400/40">
                      ★ CHAKAN • PUNE ★
                    </span>
                    <span className="bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/40 font-mono">
                      ALL INDIA PERMIT
                    </span>
                  </div>

                  {/* Company Name on Truck Container */}
                  <div className="text-center my-0.5">
                    <div className="text-xs sm:text-sm font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase font-mono">
                      {companyName}
                    </div>
                    <div className="text-[8px] font-bold text-amber-300 tracking-wider">
                      {tagline}
                    </div>
                  </div>

                  {/* Container Bottom Badges */}
                  <div className="flex items-center justify-between text-[7px] font-black font-mono text-amber-300 border-t border-amber-500/40 pt-0.5">
                    <span>MH-14-BT-9881</span>
                    <span className="bg-red-900 text-white px-1 rounded">SPEED 80</span>
                    <span className="text-amber-100">HORN OK PLEASE</span>
                  </div>

                  {/* Container Red Rear Marker Lights */}
                  <div className="absolute -left-1 top-2 w-1.5 h-3 bg-red-500 rounded-sm shadow-[0_0_6px_#ef4444]" />
                  <div className="absolute -left-1 bottom-3 w-1.5 h-3 bg-red-600 rounded-sm shadow-[0_0_6px_#ef4444]" />
                </div>

                {/* 2. Cabin Connection Hitch */}
                <div className="w-2.5 h-6 bg-slate-800 border-t border-b border-slate-600 flex-shrink-0" />

                {/* 3. Driver Cabin (Tata / BharatBenz Front) */}
                <div className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 border-2 border-blue-400 rounded-r-xl h-16 sm:h-20 w-16 sm:w-22 flex flex-col justify-between p-1.5 shadow-2xl">
                  {/* Sunshade Visor */}
                  <div className="bg-amber-400 text-slate-950 text-[7px] font-black uppercase text-center rounded-xs tracking-wider">
                    SWAMI SAMARTH
                  </div>

                  {/* Windshield Glass with Driver Silhouette */}
                  <div className="relative bg-sky-200/90 border border-sky-400 rounded-xs h-7 w-full overflow-hidden flex items-end justify-center">
                    {/* Driver Silhouette */}
                    <div className="w-4 h-5 bg-slate-900 rounded-t-full opacity-80" />
                    {/* Steering Wheel Silhouette */}
                    <div className="absolute right-1 bottom-0 w-3 h-3 rounded-full border-2 border-slate-800 opacity-70" />
                  </div>

                  {/* Chrome Bumper & Front Grille */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="w-3 h-2 bg-slate-400 rounded-xs border border-slate-200"></div>
                    <div className="w-5 h-2 bg-slate-950 rounded-xs border border-slate-700 flex flex-col justify-around p-0.5">
                      <span className="h-0.5 w-full bg-amber-400" />
                    </div>
                    {/* Glowing Headlight Bulb */}
                    <div className="w-3.5 h-3 bg-yellow-200 rounded-xs border border-yellow-400 shadow-[0_0_12px_#fde047] flex-shrink-0" />
                  </div>

                  {/* Headlight Beam Casting on Highway */}
                  <div
                    className="absolute -right-36 sm:-right-52 top-6 sm:top-7 w-36 sm:w-52 h-14 pointer-events-none opacity-50"
                    style={{
                      background: 'linear-gradient(to right, rgba(254, 240, 138, 0.45) 0%, rgba(253, 224, 71, 0.15) 60%, transparent 100%)',
                      clipPath: 'polygon(0% 25%, 100% 0%, 100% 100%, 0% 75%)',
                    }}
                  />
                </div>
              </div>

              {/* 4. Spinning Truck Wheels (Double rear axles & front axle) */}
              <div className="absolute inset-x-0 -bottom-3 flex justify-between px-3 sm:px-6 pointer-events-none">
                {/* Rear Axle 1 */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center"
                  style={{ animation: `spinWheel ${wheelSeconds} linear infinite` }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-200 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  </div>
                </div>

                {/* Rear Axle 2 */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center -ml-2 sm:-ml-4"
                  style={{ animation: `spinWheel ${wheelSeconds} linear infinite` }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-200 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  </div>
                </div>

                {/* Middle Support Wheel */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center"
                  style={{ animation: `spinWheel ${wheelSeconds} linear infinite` }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-200 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  </div>
                </div>

                {/* Front Cabin Wheel */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border-2 border-slate-700 shadow-md flex items-center justify-center"
                  style={{ animation: `spinWheel ${wheelSeconds} linear infinite` }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-200 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Road Curb / Road Edge */}
          <div
            className="h-1.5 w-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 12px, #0f172a 12px, #0f172a 24px)',
            }}
          />
        </div>

        {/* Highway Caption Footnote */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 px-1 font-mono">
          <span>📍 Chakan Talegaon MIDC Corridor • All India Daily Parcel &amp; Full Load</span>
          <span className="text-amber-400 font-bold hidden sm:inline">24x7 Active Transit Tracking</span>
        </div>
      </div>
    </div>
  );
};
