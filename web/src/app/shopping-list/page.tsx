"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import {
    ShoppingCart,
    CheckCircle2,
    Circle,
    Loader2,
    Share2,
    Download,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import slugify from "slugify";

interface ShoppingItem {
    id: string;
    text: string;
    completed: boolean;
    day: number;
}

interface FirestorePlan {
    fullPlan: string;
    shoppingListState?: { [itemId: string]: boolean };
    planDays?: string;
}

export default function ShoppingListPage() {
    const { user, loading: authLoading } = useAuth();
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        const fetchShoppingList = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, "plans", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as FirestorePlan;
                    const fullPlan = data.fullPlan || "";
                    const savedState = data.shoppingListState || {};

                    // Parse the plan to extract shopping list items
                    // Look for "## Shopping List" sections
                    const extractedItems: ShoppingItem[] = [];
                    const days = fullPlan.split(/(?=# (?:Day|Day:)\s*\d+)|(?=## (?:Day|Day:)\s*\d+)/i);

                    days.forEach((dayContent: string) => {
                        const dayMatch = dayContent.match(/# (?:Day|Day:)\s*(\d+)/i) || dayContent.match(/## (?:Day|Day:)\s*(\d+)/i);
                        const dayNum = dayMatch ? parseInt(dayMatch[1]) : 0;

                        // Extract shopping list block
                        const shoppingBlock = dayContent.split(/## Shopping List/i)[1];
                        if (shoppingBlock) {
                            // Get text until next section or end of string
                            const relevantText = shoppingBlock.split(/## /)[0];
                            const lines = relevantText.split('\n').filter(line => line.trim().startsWith('-'));

                            lines.forEach((line, idx) => {
                                const text = line.replace(/^-\s*\[?|\]?$/g, '').trim(); // Remove bullet and brackets
                                if (text) {
                                    // Generate a deterministic ID based on content
                                    const itemId = `day-${dayNum}-${slugify(text, { lower: true, strict: true })}`;

                                    extractedItems.push({
                                        id: itemId,
                                        text: text,
                                        completed: !!savedState[itemId],
                                        day: dayNum
                                    });
                                }
                            });
                        }
                    });

                    // Sort: Active first, then completed
                    extractedItems.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

                    setItems(extractedItems);
                }
            } catch (err) {
                console.error("Error fetching shopping list:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchShoppingList();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    // Save functionality
    const toggleItem = async (id: string) => {
        if (!user) return;

        const newItems = items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        setItems(newItems);

        // Optimistic UI update, then save to Firestore
        try {
            const docRef = doc(db, "plans", user.uid);
            // Construct the updated state map
            const appState = newItems.reduce((acc, item) => {
                if (item.completed) acc[item.id] = true;
                return acc;
            }, {} as { [key: string]: boolean });

            await updateDoc(docRef, {
                shoppingListState: appState
            });
        } catch (err) {
            console.error("Error saving shopping list state:", err);
            // Revert state if failed (optional, but good practice)
        }
    };

    const filteredItems = items.filter(item => {
        if (filter === 'active') return !item.completed;
        if (filter === 'completed') return item.completed;
        return true;
    });

    if (authLoading || (loading && user)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#000c1d]">
                <Loader2 className="w-12 h-12 text-secondary animate-spin" />
            </div>
        );
    }

    if (!user) {
        window.location.href = "/auth/login";
        return null;
    }

    return (
        <div className="min-h-screen px-4 lg:px-20 py-8 lg:py-12 bg-transparent text-foreground relative pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-200/50 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl lg:text-6xl font-black gold-text tracking-tighter uppercase mb-2">
                        Shopping <span className="text-stroke-1">Todo</span>
                    </h1>
                    <p className="opacity-60 text-lg">Your curated grocery checklist for the blessed month.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const text = items.map(i => `[${i.completed ? 'x' : ' '}] ${i.text}`).join('\n');
                            navigator.clipboard.writeText(text);
                            alert("Copied to clipboard!");
                        }}
                        className="glass px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Share2 className="w-4 h-4" /> Export
                    </button>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                {['all', 'active', 'completed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-all ${filter === f
                                ? "bg-secondary text-black shadow-[0_0_20px_rgba(246,224,94,0.4)]"
                                : "bg-white/5 opacity-50 hover:opacity-100 hover:bg-white/10"
                            }`}
                    >
                        {f} <span className="ml-2 opacity-60 text-xs">
                            {f === 'all' ? items.length : items.filter(i => f === 'active' ? !i.completed : i.completed).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Todo List */}
            <div className="max-w-4xl">
                {items.length === 0 ? (
                    <div className="glass p-12 rounded-[2rem] text-center opacity-50">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-xl font-bold">Your list is empty.</p>
                        <p className="text-sm">Generate a meal plan to populate your shopping list.</p>
                    </div>
                ) : (
                    <motion.div layout className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`glass group p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all duration-300 ${item.completed
                                            ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                                            : "border-white/5 hover:border-secondary/30 hover:bg-white/5"
                                        }`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.completed
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-blue-200/30 group-hover:border-secondary"
                                        }`}>
                                        {item.completed && <CheckCircle2 className="w-4 h-4 text-black" />}
                                    </div>

                                    <div className="flex-grow">
                                        <p className={`text-lg font-medium transition-all ${item.completed ? "line-through opacity-50" : "text-foreground"
                                            }`}>
                                            {item.text}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Day {item.day}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
