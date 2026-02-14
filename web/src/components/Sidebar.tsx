"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Moon,
    Sun,
    Home,
    LogOut
} from "lucide-react";
import { motion } from "framer-motion";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

const Sidebar = () => {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isDarkMode, setIsDarkMode] = React.useState(true);

    React.useEffect(() => {
        // Check localStorage on mount
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light');
            setIsDarkMode(false);
        } else {
            document.body.classList.remove('light');
            setIsDarkMode(true);
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.body.classList.add('light');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.body.classList.remove('light');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const handleLogout = async () => {
        if (confirm("Logout from Easy Ramzan Recipe?")) {
            await signOut(auth);
            window.location.href = "/auth/login";
        }
    };

    const menuItems = [
        { name: "Home", icon: Home, path: "/" },
        { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { name: "Shopping", icon: ShoppingCart, path: "/shopping-list" },
    ];

    return (
        <>
            {/* Desktop Sidebar (Left Floating Minimalist) */}
            <div className="hidden lg:flex fixed bottom-8 left-1/2 -translate-x-1/2 w-fit px-8 py-3 flex-row items-center glass rounded-full border-white/5 z-50 gap-6 no-print shadow-[0_0_50px_rgba(0,0,0,0.5)]">


                <div className="flex flex-row gap-4 items-center">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="relative group"
                            >
                                <div className={`p-3 rounded-full transition-all duration-300 ${isActive
                                    ? "bg-secondary text-black shadow-[0_0_20px_rgba(246,224,94,0.6)] scale-110"
                                    : "text-blue-100/40 hover:text-white hover:bg-white/5"
                                    }`}>
                                    <item.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                </div>

                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1 bg-white text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                    {item.name}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                </div>
                            </Link>
                        );
                    })}

                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-full text-blue-100/40 hover:text-white hover:bg-white/5 transition-all group relative"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 lg:w-6 lg:h-6" /> : <Moon className="w-5 h-5 lg:w-6 lg:h-6" />}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1 bg-white text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            {isDarkMode ? "Light Mode" : "Dark Mode"}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                        </div>
                    </button>

                    {user && (
                        <>
                            <div className="w-px h-8 bg-white/10 mx-2"></div>
                            <button
                                onClick={handleLogout}
                                className="p-3 rounded-full text-red-400 hover:bg-red-500/10 transition-all hover:scale-110"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation (Solid Premium Color) */}
            <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] bg-[#001229] border border-white/10 p-3 rounded-[2.5rem] flex items-center justify-around z-50 no-print shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link key={item.name} href={item.path} className="relative flex-1 flex flex-col items-center gap-1.5 py-1">
                            <div className={`p-2.5 rounded-xl transition-all ${isActive ? "bg-secondary text-black scale-110 shadow-[0_0_15px_rgba(246,224,94,0.4)]" : "text-blue-100/40"
                                }`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isActive ? "text-secondary" : "text-blue-100/20"}`}>
                                {item.name}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bubble-active"
                                    className="absolute -bottom-1 w-1 h-1 bg-secondary rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
                {user && (
                    <button onClick={handleLogout} className="flex-1 flex flex-col items-center gap-1.5 py-1 text-red-500/60 transition-colors active:text-red-500">
                        <div className="p-2.5 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">Exit</span>
                    </button>
                )}
            </div>
        </>
    );
};

export default Sidebar;
