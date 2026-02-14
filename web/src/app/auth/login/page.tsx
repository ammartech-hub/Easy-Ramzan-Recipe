"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/firebase/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    updateProfile,
    isSignInWithEmailLink
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, Moon } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                router.push("/dashboard");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const sharedPassword = "DirectAccessUser123!";

        try {
            // STRATEGY 1: Try Standard Login
            await signInWithEmailAndPassword(auth, email, sharedPassword);
            // If successful, useEffect detects change and redirects

        } catch (loginErr: any) {

            // STRATEGY 2: If User doesn't exist, Create it
            if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, sharedPassword);
                    // Init user data
                    const user = userCredential.user;
                    await updateProfile(user, { displayName: email.split('@')[0] });
                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        displayName: email.split('@')[0],
                        createdAt: new Date().toISOString()
                    });
                    // If successful, useEffect detects change and redirects

                } catch (createErr: any) {
                    console.error("Creation failed", createErr);
                    // If creation fails (E.g email taken but login failed?), fallback to Guest
                    await handleGuestFallback();
                }
            }
            // STRATEGY 3: If Password is "Wrong" (Old Account Blockage), Force Guest Entry
            else if (loginErr.code === 'auth/wrong-password') {
                await handleGuestFallback();
            } else {
                // Unknown error, try guest fallback anyway as last resort
                await handleGuestFallback();
            }
        }
    };

    const handleGuestFallback = async () => {
        try {
            const guestResult = await signInAnonymously(auth);
            const user = guestResult.user;

            // We pretend this guest user IS the email user by saving the email to their profile data
            // (Even though Auth doesn't fundamentally link them, the App will treat them as such)
            await updateProfile(user, { displayName: email.split('@')[0] });

            // Check if doc exists (unlikely for new guest, but good practice)
            await setDoc(doc(db, "users", user.uid), {
                email: email, // We save their claimed email
                displayName: email.split('@')[0],
                isGuest: true,
                createdAt: new Date().toISOString()
            }, { merge: true });

            router.push("/dashboard");

        } catch (guestErr: any) {
            console.error("Guest Auth Failed", guestErr);
            if (guestErr.code === 'auth/operation-not-allowed') {
                setError("AUTO-LOGIN FAILED: Please go to Firebase Console -> Authentication -> Sign-in method -> Enable 'Anonymous'");
            } else {
                setError("Access failed: " + guestErr.message);
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#000c1d]">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[180px] rounded-full opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[150px] rounded-full opacity-30"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass p-8 lg:p-12 rounded-[3rem] lg:rounded-[4rem] border-white/10 space-y-8 shadow-2xl">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-secondary/10 rounded-2xl">
                                <Moon className="text-secondary w-10 h-10 floating" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-black gold-text tracking-tighter">Welcome To Easy Ramzan Recipe</h1>
                        <p className="text-blue-100/30 text-xs font-bold tracking-widest uppercase">Enter Email to Begin</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-secondary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-5 pl-14 pr-4 text-white focus:border-secondary transition-all outline-none font-bold text-lg"
                                    placeholder="Enter your email..."
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-3xl text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-secondary to-accent py-6 rounded-[2.5rem] text-black font-black text-xl flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-white/30 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>CONTINUE APP <ArrowRight className="w-6 h-6" /></>}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
