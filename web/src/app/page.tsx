"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  Wallet,
  ChefHat,
  Send,
  Loader2,
  Moon,
  Sun,
  Zap,
  Star,
  LogIn,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [formData, setFormData] = useState({
    familySize: "",
    dailyBudget: "",
    days: "",
    cuisineType: "",
    location: "",
    ageGroups: "",
    equipment: "",
    foodItems: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // Validation for DAYS: only numbers, max 30
    if (id === "days") {
      if (value === "") {
        setFormData((prev) => ({ ...prev, [id]: value }));
        return;
      }
      // Check if it's a number
      if (!/^\d+$/.test(value)) return;

      const val = parseInt(value);
      if (val > 30) return;
    }

    // Validation for Family Size & Budget: Allow only numbers (optional but good UI)
    if (id === "familySize" || id === "dailyBudget") {
      if (value !== "" && !/^\d+$/.test(value)) return;
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const generatePlan = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Default values if empty
    const finalDays = formData.days || "7";
    const finalFamilySize = formData.familySize || "4";
    const finalBudget = formData.dailyBudget || "2000";
    const finalCuisine = formData.cuisineType || "Any";
    const finalLocation = formData.location || "India";

    setLoading(true);
    let fullPlan = "";
    const totalDays = parseInt(finalDays);
    const chunkSize = 5;

    const generateSegment = (startDay: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const endDay = Math.min(startDay + chunkSize - 1, totalDays);
        setStatus(`Syncing Days ${startDay}-${endDay}...`);

        const websocket = new WebSocket('wss://backend.buildpicoapps.com/ask_ai_streaming_v2');

        const prompt = `Generate a high-end, professional Ramadan meal plan for Days ${startDay} to ${endDay} (Total Goal: ${totalDays} days). 
        
        CRITICAL FORMAT for EACH day (${startDay} to ${endDay}):
        # Day [Number]
        
        ## Suhoor
        - [Feature Item 1 (E.g, Oat Porridge with Honey)]
        - [Feature Item 2]
        
        ## Iftar
        - [Feature Item 1 (E.g, Dates and Fresh Juice)]
        - [Feature Item 2]
        
        ## Detailed Preparation
        - Step 1: Specific instruction with precise measurements.
        - Step 2: Cooking time and heat level.
        - Step 3: Plating instruction.
        
        ## Shopping List
        - [Ingredient 1: Quantity]
        - [Ingredient 2: Quantity]
        - [Ingredient 3: Quantity]
        
        (Strictly ingredients for Suhoor/Iftar only. NO generic items.)

        Context: Family of ${finalFamilySize}, Budget INR ${finalBudget}/day, Location: ${finalLocation}, ${finalCuisine} style.
        IMPORTANT: 
        1. Use Markdown headings (##) for Suhoor, Iftar, Preparation, and Shopping List.
        2. ENSURE A BLANK LINE BEFORE EVERY HEADING.
        3. Each list item MUST be on a new line. Do not bunch them together.`;

        websocket.addEventListener("open", () => {
          websocket.send(JSON.stringify({ appId: "early-ahead", prompt }));
        });

        websocket.addEventListener("message", (event) => {
          fullPlan += event.data;
        });

        websocket.addEventListener("close", (event) => {
          if (event.code === 1000) {
            if (endDay < totalDays) {
              generateSegment(endDay + 1).then(resolve).catch(reject);
            } else {
              resolve();
            }
          } else {
            reject(new Error("Segment failed"));
          }
        });

        websocket.addEventListener("error", (err) => reject(err));
      });
    };

    try {
      await generateSegment(1);

      // Save to Firestore
      await setDoc(doc(db, "plans", user.uid), {
        fullPlan: fullPlan,
        planDays: finalDays,
        updatedAt: new Date().toISOString()
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      // Even if it fails, try to save what we have
      if (fullPlan) {
        await setDoc(doc(db, "plans", user.uid), {
          fullPlan: fullPlan,
          planDays: finalDays,
          updatedAt: new Date().toISOString()
        });
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  };


  if (authLoading) return null;

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 lg:p-12 overflow-hidden transition-colors duration-500`}>
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        .hero-glow {
          box-shadow: 0 0 100px rgba(246, 224, 94, 0.1);
        }
      `}</style>

      {/* Dynamic Background Elements - Constellation & Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[180px] rounded-full opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full opacity-30"></div>

      {/* Decorative Moon/Lantern - Top Right Perspective */}
      <div className="absolute top-10 right-10 opacity-10 lg:opacity-20 pointer-events-none hidden lg:block">
        <Star className="w-12 h-12 text-secondary floating-alternate fill-secondary" />
      </div>


      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8 lg:space-y-12 text-left relative">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 w-fit">
              <Zap className="w-4 h-4 text-secondary fill-secondary" />
              <span className="text-secondary text-[10px] uppercase font-black tracking-widest">AI-Powered Planning Recipe</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-[7rem] font-black text-secondary leading-[0.9] tracking-tight uppercase">
              Blessed <br />
              <span className="text-orange-500">Ramadan</span> <br />
            </h1>

            <p className="opacity-70 text-lg lg:text-xl max-w-md font-medium leading-relaxed">
              Customized Sehar & Iftar plans tailored to your family's health and budget.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="bg-blue-900/30 border border-blue-500/20 p-6 rounded-3xl w-40 text-center backdrop-blur-sm">
              <div className="text-3xl font-black text-secondary mb-1">30</div>
              <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Days Plan</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-500/20 p-6 rounded-3xl w-40 text-center backdrop-blur-sm">
              <div className="text-3xl font-black text-primary mb-1">100%</div>
              <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Custom</div>
            </div>
          </div>


          {/* Floating Mood Card - Bottom Left */}
          {/* <div className="absolute -bottom-32 left-0 hidden lg:block">
            <div className="bg-[#0f172a] border border-blue-500/20 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <div className="text-[10px] text-blue-400/60 uppercase font-bold tracking-widest">Ramadan Mood</div>
                <div className="text-secondary font-bold text-sm">Barka Mode Active</div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Right Column - Config Card */}
        <div className="lg:col-span-5 relative">
          <div className="glass p-8 lg:p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-secondary/20 transition-colors duration-500"></div>

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <Moon className="w-6 h-6 text-secondary transform -rotate-12" />
              <h2 className="text-2xl font-black text-white tracking-tight">Configure Your Plan</h2>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Family Size</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 focus-within:bg-white/10 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(246,224,94,0.1)] transition-all duration-300">
                    <Users className="w-4 h-4 text-primary" />
                    <input
                      id="familySize"
                      type="text"
                      inputMode="numeric"
                      value={formData.familySize}
                      onChange={handleInputChange}
                      placeholder="E.g 4"
                      className="bg-transparent w-full outline-none font-bold placeholder:opacity-40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Days</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 focus-within:bg-white/10 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(246,224,94,0.1)] transition-all duration-300">
                    <Calendar className="w-4 h-4 text-primary" />
                    <input
                      id="days"
                      type="text"
                      inputMode="numeric"
                      max="30"
                      value={formData.days}
                      onChange={handleInputChange}
                      placeholder="E.g 30"
                      className="bg-transparent w-full outline-none font-bold placeholder:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Daily Budget (INR)</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 focus-within:bg-white/10 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(246,224,94,0.1)] transition-all duration-300">
                  <Wallet className="w-4 h-4 text-primary" />
                  <input
                    id="dailyBudget"
                    type="text"
                    inputMode="numeric"
                    value={formData.dailyBudget}
                    onChange={handleInputChange}
                    placeholder="E.g 2000"
                    className="bg-transparent w-full outline-none font-bold placeholder:opacity-40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Cuisine Type</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 focus-within:bg-white/10 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(246,224,94,0.1)] transition-all duration-300">
                  <ChefHat className="w-4 h-4 text-primary" />
                  <input
                    id="cuisineType"
                    type="text"
                    value={formData.cuisineType}
                    onChange={handleInputChange}
                    placeholder="E.g Mumbai"
                    className="bg-transparent w-full outline-none font-bold placeholder:opacity-40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest ml-1">Location</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 focus-within:bg-white/10 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(246,224,94,0.1)] transition-all duration-300">
                  <span className="text-primary text-sm">📍</span>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="E.g Country"
                    className="bg-transparent w-full outline-none font-bold placeholder:opacity-40"
                  />
                </div>
              </div>

              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{status || "Syncing..."}</span>
                  </>
                ) : (
                  <>
                    <span>Fetch Your Recipe </span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
