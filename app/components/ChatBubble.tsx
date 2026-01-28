"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export type Block = {
    text: string;
    phase: "immediate" | "context" | "deep";
};

interface ChatBubbleProps {
    role: "user" | "assistant";
    content: string;
    blocks?: Block[];
    timestamp?: string;
    isLatest: boolean;
}

const Typewriter = ({ text, speed = 10, delay = 0 }: { text: string; speed?: number; delay?: number }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const startTyping = () => {
            let i = 0;
            const tick = () => {
                if (i <= text.length) {
                    setDisplayedText(text.slice(0, i));
                    i++;
                    timeout = setTimeout(tick, speed);
                }
            };
            tick();
        };

        const initialDelay = setTimeout(startTyping, delay * 1000);
        return () => {
            clearTimeout(initialDelay);
            clearTimeout(timeout);
        };
    }, [text, speed, delay]);

    return <span>{displayedText}</span>;
};

export default function ChatBubble({ role, content, blocks, timestamp, isLatest }: ChatBubbleProps) {
    const [showPhase2, setShowPhase2] = useState(false);
    const [showPhase3, setShowPhase3] = useState(false);

    useEffect(() => {
        if (role === "assistant" && isLatest && blocks && blocks.length > 0) {

            const hasImmediate = blocks.some(b => b.phase === "immediate");
            const hasContext = blocks.some(b => b.phase === "context");

            // Calculate natural delays based on what's actually there
            // If no immediate line, context starts sooner.
            // If no context, deep starts sooner.

            const p2Delay = hasImmediate ? 600 : 0;
            const p3Delay = p2Delay + (hasContext ? 800 : 200);

            const t1 = setTimeout(() => setShowPhase2(true), p2Delay);
            const t2 = setTimeout(() => setShowPhase3(true), p3Delay);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        } else {
            // Not latest or history -> show all
            setShowPhase2(true);
            setShowPhase3(true);
        }
    }, [role, isLatest, blocks]);

    if (role === "user") {
        return (
            <div className="flex w-full justify-end">
                <div className="max-w-[85%] lg:max-w-[70%] p-5 rounded-2xl text-lg leading-relaxed shadow-sm bg-blue-600 text-white rounded-br-none relative pb-8">
                    {content}
                    {timestamp && (
                        <span className="absolute bottom-2 right-4 text-[11px] text-blue-100/70 font-medium tracking-wide">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Assistant Logic
    const hasBlocks = blocks && blocks.length > 0;

    // Helper to find block by phase
    const immediate = hasBlocks ? blocks.find(b => b.phase === "immediate") : null;
    const context = hasBlocks ? blocks.find(b => b.phase === "context") : null;
    const deep = hasBlocks ? blocks.find(b => b.phase === "deep") : null;

    // Fallback if no blocks (e.g. error or old history without parsing)
    if (!hasBlocks) {
        return (
            <div className="flex w-full justify-start">
                <div className="max-w-[85%] lg:max-w-[70%] p-5 rounded-2xl text-lg leading-relaxed shadow-sm bg-[#1E293B] text-slate-200 border border-slate-800 rounded-bl-none relative pb-8">
                    {content}
                    {timestamp && (
                        <span className="absolute bottom-2 right-4 text-[11px] text-slate-500 font-medium tracking-wide">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full justify-start">
            <div className="max-w-[85%] lg:max-w-[70%] p-5 rounded-2xl text-lg leading-relaxed shadow-sm bg-[#1E293B] text-slate-200 border border-slate-800 rounded-bl-none space-y-4">

                {/* PHASE 1: IMMEDIATE */}
                {immediate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {immediate.text}
                    </motion.div>
                )}

                {/* PHASE 2: CONTEXT (Fade In / Type) */}
                {context && showPhase2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-slate-300 border-l-2 border-slate-600 pl-3 italic"
                    >
                        {/* Use Typewriter if it's the latest message, otherwise text */}
                        {isLatest ? <Typewriter text={context.text} speed={15} /> : context.text}
                    </motion.div>
                )}

                {/* PHASE 3: DEEP (Slow Reveal) */}
                {deep && showPhase3 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        {isLatest ? <Typewriter text={deep.text} speed={25} delay={0} /> : deep.text}
                    </motion.div>
                )}

                {timestamp && (
                    <span className="absolute bottom-2 right-4 text-[11px] text-slate-500 font-medium tracking-wide select-none">
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    );
}
