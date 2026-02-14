import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanChatbotProps {
    context: string;
    dayNumber: number;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function PlanChatbot({ context, dayNumber }: PlanChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        // Placeholder for the streaming response
        let aiResponse = "";

        try {
            const websocket = new WebSocket('wss://backend.buildpicoapps.com/ask_ai_streaming_v2');

            const prompt = `
            You are an expert Muslim Chef and Nutritionist AI assistant.
            
            CONTEXT (The user's meal plan for Day ${dayNumber}):
            """
            ${context}
            """

            USER QUESTION: "${userMessage}"

            INSTRUCTIONS:
            1. Answer the user's question based strictly on the provided plan context if relevant.
            2. If they ask about preparation details, provide deep, step-by-step cooking advice, tips, and tricks.
            3. If they ask about nutrition, explain the benefits for fasting (Suhoor/Iftar).
            4. Be polite, encouraging, and concise but detailed.
            `;

            websocket.onopen = () => {
                websocket.send(JSON.stringify({ appId: "early-ahead", prompt }));
            };

            websocket.onmessage = (event) => {
                aiResponse += event.data;
                // Update the *current* assistant message in real-time
                setMessages(prev => {
                    const newHistory = [...prev];
                    // If the last message is already from assistant (streaming), update it
                    if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant') {
                        newHistory[newHistory.length - 1].content = aiResponse;
                        return newHistory;
                    } else {
                        // First chunk, add new assistant message
                        return [...newHistory, { role: 'assistant', content: aiResponse }];
                    }
                });
            };

            websocket.onclose = () => {
                setLoading(false);
            };

            websocket.onerror = (error) => {
                console.error("WebSocket Error:", error);
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
                setLoading(false);
            };

        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <section className="my-8">
            <div className="glass rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl relative">
                {/* Header / Toggle */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-6 lg:p-8 bg-gradient-to-r from-blue-900/40 to-purple-900/40 cursor-pointer flex items-center justify-between group hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-secondary/20 rounded-2xl group-hover:scale-110 transition-transform">
                            <Bot className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                CHEF AI ASSISTANT <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
                            </h3>
                            <p className="text-sm text-blue-200/50 font-medium">Ask about recipes, ingredients, or cooking tips for Day {dayNumber}</p>
                        </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <Sparkles className="w-5 h-5 text-secondary" />
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/20"
                        >
                            <div className="p-6 lg:p-8 space-y-6">
                                {/* Chat Area */}
                                <div className="h-[300px] lg:h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8">
                                            <Bot className="w-16 h-16 mb-4 text-secondary" />
                                            <p className="text-sm uppercase tracking-widest font-bold">Ask me anything about today's meal plan!</p>
                                            <p className="text-xs mt-2">"How do I cook the Suhoor oats?"<br />"What can I substitute for dates?"</p>
                                        </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[85%] lg:max-w-[75%] p-4 lg:p-5 rounded-3xl text-sm lg:text-base leading-relaxed ${msg.role === 'user'
                                                        ? 'bg-secondary text-black font-medium rounded-tr-none'
                                                        : 'bg-white/10 text-blue-50 border border-white/5 rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.role === 'assistant' ? (
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-bold text-secondary" {...props} />
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                                                <span className="text-xs opacity-50 uppercase tracking-widest">Chef is thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-accent rounded-[2rem] opacity-20 group-hover:opacity-40 transition-opacity blur"></div>
                                    <div className="relative flex items-center bg-[#0a1628] rounded-[2rem] p-2 pr-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Type your question..."
                                            className="flex-1 bg-transparent border-none outline-none text-white px-6 py-4 font-medium placeholder:text-blue-100/30"
                                            disabled={loading}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || loading}
                                            className="p-4 bg-secondary text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
