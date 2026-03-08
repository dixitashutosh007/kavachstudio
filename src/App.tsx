/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { 
  Download, 
  Upload, 
  User, 
  Trophy, 
  Settings, 
  Sparkles, 
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type PlayerType = 'batsman' | 'bowler' | 'all-rounder';
type AspectRatio = 'post' | 'reel';
type AIStyle = 'fierce' | 'stylish' | 'calm' | 'aggressive' | 'blurred' | 'ground';

interface TeamInfo {
  name: string;
  score: string;
  overs: string;
}

interface BatsmanStats {
  runs: string;
  balls: string;
  isNotOut: boolean;
}

interface BowlerStats {
  overs: string;
  runs: string;
  wickets: string;
}

interface CardData {
  playerName: string;
  playerType: PlayerType;
  batsmanStats: BatsmanStats;
  bowlerStats: BowlerStats;
  teamA: TeamInfo;
  teamB: TeamInfo;
  matchResult: string;
  themeColor: string;
  aspectRatio: AspectRatio;
  playerImage: string | null;
  logoImage: string | null;
  aiStyle: AIStyle;
  isAIEnabled: boolean;
}

// --- Constants ---
const DEFAULT_KAVACH_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZD0iTTEwMCAyMEw0MCA1MFYxMDBDNDAgMTQwIDEwMCAxODAgMTAwIDE4MEMxMDAgMTgwIDE2MCAxNDAgMTYwIDEwMFY1MEwxMDAgMjBaIiBmaWxsPSIjRjI3RDI2Ii8+CiAgPHRleHQgeD0iMTAwIiB5PSIxMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2MCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5LPC90ZXh0Pgo8L3N2Zz4=";

const THEMES = [
  { name: 'KAvach Gold', color: '#F27D26', secondary: '#000000' },
  { name: 'Royal Blue', color: '#1E40AF', secondary: '#FFFFFF' },
  { name: 'Cricket Green', color: '#15803D', secondary: '#FFFFFF' },
  { name: 'Elite Red', color: '#B91C1C', secondary: '#FFFFFF' },
  { name: 'Deep Purple', color: '#6D28D9', secondary: '#FFFFFF' },
];

const AI_STYLES: { id: AIStyle; label: string; prompt: string }[] = [
  { id: 'fierce', label: 'Fierce', prompt: 'Make the player look fierce and determined with intense lighting and dramatic shadows.' },
  { id: 'stylish', label: 'Stylish', prompt: 'Make the player look stylish and professional, like a magazine cover portrait.' },
  { id: 'calm', label: 'Calm', prompt: 'Make the player look calm and composed with soft, natural lighting.' },
  { id: 'aggressive', label: 'Aggressive', prompt: 'Make the player look aggressive and powerful in action.' },
  { id: 'blurred', label: 'Blurred Background', prompt: 'Keep the player sharp but add a beautiful cinematic bokeh blur to the background.' },
  { id: 'ground', label: 'Cricket Ground', prompt: 'Place the player in a professional cricket stadium background with floodlights.' },
];

// --- Components ---

const KAvachLogo = ({ className, logoImage }: { className?: string, logoImage?: string | null }) => (
  <div className={cn("flex flex-col items-center", className)}>
    <div className="relative w-20 h-20 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg border-2 border-[#F27D26] overflow-hidden">
       {logoImage ? (
         <img 
           src={logoImage} 
           alt="KAvach Logo" 
           className="w-full h-full object-contain"
         />
       ) : (
         <div className="w-full h-full rounded-lg bg-black flex flex-col items-center justify-center overflow-hidden p-1">
           <span className="text-[#F27D26] font-black text-2xl italic leading-none">K</span>
           <span className="text-white text-[6px] font-bold tracking-widest uppercase mt-0.5">KAvach</span>
         </div>
       )}
    </div>
  </div>
);

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<CardData>({
    playerName: 'Suryakumar Yadav',
    playerType: 'batsman',
    batsmanStats: {
      runs: '111',
      balls: '51',
      isNotOut: true,
    },
    bowlerStats: {
      overs: '4.0',
      runs: '24',
      wickets: '3',
    },
    teamA: { name: 'KAvach', score: '191/6', overs: '20' },
    teamB: { name: 'NEW ZEALAND', score: '126', overs: '18.5' },
    matchResult: 'KAvach WON BY 65 RUNS',
    themeColor: '#F27D26',
    aspectRatio: 'post',
    playerImage: null,
    logoImage: DEFAULT_KAVACH_LOGO,
    aiStyle: 'stylish',
    isAIEnabled: false,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, playerImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, logoImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const applyAI = async () => {
    if (!data.playerImage) return;
    
    setGeneratingAI(true);
    try {
      const style = AI_STYLES.find(s => s.id === data.aiStyle);
      
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: data.playerImage,
          stylePrompt: style?.prompt,
          styleLabel: style?.label,
        }),
      });

      const contentType = response.headers.get("content-type");
      let result;
      
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result.error || `AI enhancement failed with status ${response.status}`);
      }
      
      if (result.image) {
        setData(prev => ({ 
          ...prev, 
          playerImage: result.image,
          isAIEnabled: true 
        }));
      } else {
        throw new Error("No image returned from AI");
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      alert(error.message || "AI enhancement failed. Please try again.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      // Ensure all images are loaded and decoded
      const images = Array.from(cardRef.current.getElementsByTagName('img')) as HTMLImageElement[];
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }));

      // Small delay to ensure all assets are rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        cacheBust: false,
        skipFonts: false,
        includeQueryParams: false,
      });
      
      const link = document.createElement('a');
      link.download = `KAvach_${data.playerName}_POTM.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
      alert('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStats = () => {
    const labelClass = "text-[9px] uppercase tracking-[0.15em] font-black opacity-40 mb-0.5";
    const valueClass = "text-xl font-black tracking-tighter leading-none";
    const borderClass = "border-l-2 pl-2.5 py-0.5";

    const calculateSR = (runs: string, balls: string) => {
      const r = parseFloat(runs);
      const b = parseFloat(balls);
      if (!r || !b) return "0.0";
      return ((r / b) * 100).toFixed(1);
    };

    const calculateEconomy = (runs: string, overs: string) => {
      const r = parseFloat(runs);
      const o = parseFloat(overs);
      if (!r || !o) return "0.00";
      const fullOvers = Math.floor(o);
      const balls = Math.round((o - fullOvers) * 10);
      const totalOvers = fullOvers + (balls / 6);
      return (r / totalOvers).toFixed(2);
    };

    if (data.playerType === 'batsman') {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className={cn(borderClass)} style={{ borderColor: data.themeColor }}>
            <div className={labelClass}>Runs</div>
            <div className={valueClass}>{data.batsmanStats.runs}{data.batsmanStats.isNotOut ? '*' : ''}</div>
            <div className="text-[8px] uppercase font-bold opacity-30 mt-1">({data.batsmanStats.balls} Balls)</div>
          </div>
          <div className={cn(borderClass)} style={{ borderColor: data.themeColor }}>
            <div className={labelClass}>Strike Rate</div>
            <div className={valueClass}>{calculateSR(data.batsmanStats.runs, data.batsmanStats.balls)}</div>
          </div>
        </div>
      );
    } else if (data.playerType === 'bowler') {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className={cn(borderClass)} style={{ borderColor: data.themeColor }}>
            <div className={labelClass}>Wickets</div>
            <div className={valueClass}>{data.bowlerStats.wickets}</div>
            <div className="text-[8px] uppercase font-bold opacity-30 mt-1">({data.bowlerStats.overs} Overs)</div>
          </div>
          <div className={cn(borderClass)} style={{ borderColor: data.themeColor }}>
            <div className={labelClass}>Economy</div>
            <div className={valueClass}>{calculateEconomy(data.bowlerStats.runs, data.bowlerStats.overs)}</div>
            <div className="text-[8px] uppercase font-bold opacity-30 mt-1">({data.bowlerStats.runs} Runs)</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className={cn(borderClass)} style={{ borderColor: data.themeColor }}>
            <div className={labelClass}>Batting</div>
            <div className={valueClass}>{data.batsmanStats.runs}{data.batsmanStats.isNotOut ? '*' : ''}</div>
            <div className="text-[8px] uppercase font-bold opacity-30 mt-1">SR: {calculateSR(data.batsmanStats.runs, data.batsmanStats.balls)} ({data.batsmanStats.balls}b)</div>
          </div>
          <div className={cn(borderClass)} style={{ borderColor: data.themeColor }}>
            <div className={labelClass}>Bowling</div>
            <div className={valueClass}>{data.bowlerStats.wickets}/{data.bowlerStats.runs}</div>
            <div className="text-[8px] uppercase font-bold opacity-30 mt-1">Eco: {calculateEconomy(data.bowlerStats.runs, data.bowlerStats.overs)} ({data.bowlerStats.overs}o)</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#F27D26]/30">
      {/* Header */}
      <header className="border-b border-white/10 py-4 px-6 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F27D26] rounded-lg flex items-center justify-center">
            <Trophy className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">KAvach Studio</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Go Get Them !</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
            <span className={cn(step >= 1 ? "text-[#F27D26]" : "")}>Details</span>
            <ChevronRight size={12} />
            <span className={cn(step >= 2 ? "text-[#F27D26]" : "")}>Style</span>
            <ChevronRight size={12} />
            <span className={cn(step >= 3 ? "text-[#F27D26]" : "")}>Export</span>
          </div>
          <button 
            onClick={downloadCard}
            disabled={loading || !data.playerImage}
            className="bg-[#F27D26] hover:bg-[#F27D26]/90 disabled:opacity-50 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
            {loading ? 'Processing...' : 'Download'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        
        {/* Left: Controls */}
        <div className="lg:col-span-5 space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <User size={16} className="text-[#F27D26]" />
                    Player Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase text-white/40 mb-1 block">Player Name</label>
                      <input 
                        type="text" 
                        value={data.playerName}
                        onChange={(e) => setData(prev => ({ ...prev, playerName: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F27D26] transition-colors"
                        placeholder="Enter player name"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(['batsman', 'bowler', 'all-rounder'] as PlayerType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setData(prev => ({ ...prev, playerType: type }))}
                          className={cn(
                            "py-2 rounded-lg text-[10px] uppercase font-bold border transition-all",
                            data.playerType === type 
                              ? "bg-[#F27D26] text-black border-[#F27D26]" 
                              : "bg-transparent border-white/10 text-white/60 hover:border-white/30"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Settings size={16} className="text-[#F27D26]" />
                    Match Stats
                  </h2>

                  <div className="space-y-6">
                    {/* Batsman Stats */}
                    {(data.playerType === 'batsman' || data.playerType === 'all-rounder') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 flex items-center justify-between">
                          <span className="text-[10px] uppercase text-white/60">Batting Performance</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={data.batsmanStats.isNotOut}
                              onChange={(e) => setData(prev => ({ ...prev, batsmanStats: { ...prev.batsmanStats, isNotOut: e.target.checked } }))}
                              className="accent-[#F27D26]"
                            />
                            <span className="text-[10px] uppercase">Not Out</span>
                          </label>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/40 ml-1">Runs</label>
                          <input 
                            type="text" placeholder="Runs"
                            value={data.batsmanStats.runs}
                            onChange={(e) => setData(prev => ({ ...prev, batsmanStats: { ...prev.batsmanStats, runs: e.target.value } }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/40 ml-1">Balls</label>
                          <input 
                            type="text" placeholder="Balls"
                            value={data.batsmanStats.balls}
                            onChange={(e) => setData(prev => ({ ...prev, batsmanStats: { ...prev.batsmanStats, balls: e.target.value } }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bowler Stats */}
                    {(data.playerType === 'bowler' || data.playerType === 'all-rounder') && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <span className="col-span-2 text-[10px] uppercase text-white/60">Bowling Performance</span>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/40 ml-1">Wickets</label>
                          <input 
                            type="text" placeholder="Wickets"
                            value={data.bowlerStats.wickets}
                            onChange={(e) => setData(prev => ({ ...prev, bowlerStats: { ...prev.bowlerStats, wickets: e.target.value } }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/40 ml-1">Overs</label>
                          <input 
                            type="text" placeholder="Overs"
                            value={data.bowlerStats.overs}
                            onChange={(e) => setData(prev => ({ ...prev, bowlerStats: { ...prev.bowlerStats, overs: e.target.value } }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/40 ml-1">Runs</label>
                          <input 
                            type="text" placeholder="Runs"
                            value={data.bowlerStats.runs}
                            onChange={(e) => setData(prev => ({ ...prev, bowlerStats: { ...prev.bowlerStats, runs: e.target.value } }))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full text-sm font-bold transition-all"
                  >
                    Next: Style & Image <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#F27D26]" />
                    Branding & Assets
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] uppercase text-white/40 mb-3 block">KAvach Logo</span>
                      <div 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#F27D26]/50 hover:bg-[#F27D26]/5 transition-all group overflow-hidden"
                      >
                        {data.logoImage ? (
                          <img src={data.logoImage} alt="Logo" className="h-full object-contain p-2" />
                        ) : (
                          <>
                            <Upload className="text-white/20 group-hover:text-[#F27D26] transition-colors" size={24} />
                            <span className="text-[10px] text-white/40 group-hover:text-white/60">Upload KAvach Logo</span>
                          </>
                        )}
                        <input id="logo-upload" type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <span className="text-[10px] uppercase text-white/40 mb-3 block">Player Photo</span>
                      <div 
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#F27D26]/50 hover:bg-[#F27D26]/5 transition-all group overflow-hidden"
                      >
                        {data.playerImage ? (
                          <img src={data.playerImage} alt="Player" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload className="text-white/20 group-hover:text-[#F27D26] transition-colors" size={32} />
                            <span className="text-xs text-white/40 group-hover:text-white/60">Upload Player Photo</span>
                          </>
                        )}
                        <input id="image-upload" type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      </div>
                    </div>

                    {data.playerImage && (
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#F27D26] flex items-center gap-2">
                            <Sparkles size={12} />
                            AI Enhancement
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {AI_STYLES.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setData(prev => ({ ...prev, aiStyle: style.id }))}
                              className={cn(
                                "px-2 py-2 rounded-lg text-[8px] uppercase font-bold border transition-all",
                                data.aiStyle === style.id 
                                  ? "bg-white text-black border-white" 
                                  : "bg-transparent border-white/10 text-white/60 hover:border-white/30"
                              )}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={applyAI}
                          disabled={generatingAI}
                          className="w-full bg-gradient-to-r from-[#F27D26] to-orange-400 text-black py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {generatingAI ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                          {generatingAI ? 'AI is Crafting...' : 'Enhance with AI'}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Settings size={16} className="text-[#F27D26]" />
                    Theme & Layout
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] uppercase text-white/40 mb-3 block">Color Theme</span>
                      <div className="flex flex-wrap gap-3">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => setData(prev => ({ ...prev, themeColor: theme.color }))}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                              data.themeColor === theme.color ? "border-white scale-110" : "border-transparent opacity-60"
                            )}
                            style={{ backgroundColor: theme.color }}
                          >
                            {data.themeColor === theme.color && <Check size={14} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-white/40 mb-3 block">Aspect Ratio</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setData(prev => ({ ...prev, aspectRatio: 'post' }))}
                          className={cn(
                            "py-3 rounded-xl text-[10px] uppercase font-bold border transition-all flex items-center justify-center gap-2",
                            data.aspectRatio === 'post' 
                              ? "bg-white text-black border-white" 
                              : "bg-transparent border-white/10 text-white/60"
                          )}
                        >
                          Post (1:1)
                        </button>
                        <button
                          onClick={() => setData(prev => ({ ...prev, aspectRatio: 'reel' }))}
                          className={cn(
                            "py-3 rounded-xl text-[10px] uppercase font-bold border transition-all flex items-center justify-center gap-2",
                            data.aspectRatio === 'reel' 
                              ? "bg-white text-black border-white" 
                              : "bg-transparent border-white/10 text-white/60"
                          )}
                        >
                          Reel (9:16)
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-between">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full text-sm font-bold transition-all"
                  >
                    Next: Finalize <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Trophy size={16} className="text-[#F27D26]" />
                    Match Context
                  </h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
                          <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Team A</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[9px] uppercase text-white/30 ml-1">Team Name</label>
                            <input 
                              type="text" value={data.teamA.name}
                              onChange={(e) => setData(prev => ({ ...prev, teamA: { ...prev.teamA, name: e.target.value } }))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                              placeholder="Team A Name"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase text-white/30 ml-1">Score</label>
                            <input 
                              type="text" placeholder="e.g. 191/6"
                              value={data.teamA.score}
                              onChange={(e) => setData(prev => ({ ...prev, teamA: { ...prev.teamA, score: e.target.value } }))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase text-white/30 ml-1">Overs</label>
                            <input 
                              type="text" placeholder="e.g. 20"
                              value={data.teamA.overs}
                              onChange={(e) => setData(prev => ({ ...prev, teamA: { ...prev.teamA, overs: e.target.value } }))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">Team B</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[9px] uppercase text-white/30 ml-1">Team Name</label>
                            <input 
                              type="text" value={data.teamB.name}
                              onChange={(e) => setData(prev => ({ ...prev, teamB: { ...prev.teamB, name: e.target.value } }))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                              placeholder="Team B Name"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase text-white/30 ml-1">Score</label>
                            <input 
                              type="text" placeholder="e.g. 126"
                              value={data.teamB.score}
                              onChange={(e) => setData(prev => ({ ...prev, teamB: { ...prev.teamB, score: e.target.value } }))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase text-white/30 ml-1">Overs</label>
                            <input 
                              type="text" placeholder="e.g. 18.5"
                              value={data.teamB.overs}
                              onChange={(e) => setData(prev => ({ ...prev, teamB: { ...prev.teamB, overs: e.target.value } }))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27D26]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-white/40 mb-1 block">Match Result</label>
                      <input 
                        type="text" 
                        value={data.matchResult}
                        onChange={(e) => setData(prev => ({ ...prev, matchResult: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#F27D26] transition-colors"
                        placeholder="e.g. INDIA WON BY 65 RUNS"
                      />
                    </div>
                  </div>
                </section>

                <div className="flex justify-between">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button 
                    onClick={downloadCard}
                    className="flex items-center gap-2 bg-[#F27D26] text-black px-8 py-3 rounded-full text-sm font-bold transition-all active:scale-95"
                  >
                    Download Card <Download size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="sticky top-24 w-full flex flex-col items-center">
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 mb-4">Live Preview</div>
            
            <div 
              ref={cardRef}
              className={cn(
                "relative overflow-hidden bg-white shadow-2xl transition-all duration-500",
                data.aspectRatio === 'post' ? "aspect-square w-full max-w-[500px]" : "aspect-[9/16] w-full max-w-[400px]"
              )}
              style={{ backgroundColor: '#F8F9FA' }}
            >
              {/* Player Image Overlay - Moved to very bottom of DOM stack */}
              <div className="absolute inset-0 z-1">
                {data.playerImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={data.playerImage} 
                      alt="Player" 
                      className="w-full h-full object-cover object-top"
                      onError={(e) => console.error("Player image load error", e)}
                    />
                    {/* Gradient Overlays for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001F3F] via-transparent to-white/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <User size={120} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Background Texture/Gradient */}
              <div className="absolute inset-0 opacity-5 pointer-events-none z-1">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/20 via-transparent to-transparent" />
              </div>

              {/* Main Content Layout */}
              <div className="relative h-full flex flex-col z-10">
                
                {/* Top Bar: Logo & Title */}
                <div className="flex justify-between items-start p-6 pb-0">
                  <div className="bg-white p-3 rounded-br-2xl shadow-sm border-b border-r border-black/5 -ml-6 -mt-6">
                    <h3 className="text-2xl font-black text-[#001F3F] leading-none tracking-tighter italic">
                      PLAYER <span className="text-[8px] block font-bold not-italic tracking-widest opacity-60 mt-1">OF THE</span>
                      MATCH
                    </h3>
                    <div 
                      className="h-1 w-12 mt-1.5" 
                      style={{ backgroundColor: data.themeColor }} 
                    />
                  </div>
                  <div className="bg-white p-2 rounded-bl-2xl shadow-sm border-b border-l border-black/5 -mr-6 -mt-6">
                    <KAvachLogo logoImage={data.logoImage} className="scale-75 origin-top-right text-[#001F3F]" />
                  </div>
                </div>

                <div className="px-6 flex-1 flex flex-col">
                  {/* Spacer for Reel Mode to push content down */}
                  {data.aspectRatio === 'reel' && <div className="flex-1" />}

                  {/* Player Name Overlay */}
                  <div className={cn("relative z-30", data.aspectRatio === 'reel' ? "mt-0 mb-4" : "mt-8")}>
                    <h4 
                      className="relative text-xl font-black uppercase tracking-tight inline-block px-4 py-1 text-white shadow-xl transform -skew-x-12"
                      style={{ backgroundColor: data.themeColor }}
                    >
                      {data.playerName}
                    </h4>
                  </div>

                  {/* Stats Section - Compact & Semi-transparent for background visibility */}
                  <div className={cn("flex flex-col justify-center relative z-30", data.aspectRatio === 'reel' ? "mb-8" : "flex-1")}>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-white/50 shadow-xl max-w-[50%] text-[#001F3F]">
                        {renderStats()}
                    </div>
                  </div>

                  {/* Team Scores - Bottom Section */}
                  <div className="mt-auto bg-[#001F3F] text-white p-4 rounded-t-2xl shadow-2xl relative z-30">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-5 h-5 bg-white rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-[#001F3F]">
                            {data.teamA.name.charAt(0)}
                          </div>
                          <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase truncate">{data.teamA.name}</span>
                        </div>
                        <div className="text-lg font-black leading-none tracking-tighter truncate">{data.teamA.score}</div>
                        <div className="text-[7px] uppercase font-bold opacity-40 mt-0.5 truncate">{data.teamA.overs} OVERS</div>
                      </div>
                      
                      <div className="w-px h-8 bg-white/20" />

                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                          <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase truncate">{data.teamB.name}</span>
                          <div className="w-5 h-5 bg-white rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-[#001F3F]">
                            {data.teamB.name.charAt(0)}
                          </div>
                        </div>
                        <div className="text-lg font-black leading-none tracking-tighter truncate">{data.teamB.score}</div>
                        <div className="text-[7px] uppercase font-bold opacity-40 mt-0.5 truncate">{data.teamB.overs} OVERS</div>
                      </div>
                    </div>

                    {/* Result Banner */}
                    <div 
                      className="mt-2.5 py-1.5 px-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-white rounded-lg shadow-inner"
                      style={{ backgroundColor: data.themeColor }}
                    >
                      {data.matchResult}
                    </div>

                    {/* Footer */}
                    <div className="mt-2.5 flex justify-between items-center text-[7px] font-bold opacity-40 uppercase tracking-widest">
                      <span>kavachcricket.com</span>
                      <span>Go Get Them !</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-white/30 text-center max-w-sm">
              Tip: Use AI enhancement to create a professional studio look for your player photo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
