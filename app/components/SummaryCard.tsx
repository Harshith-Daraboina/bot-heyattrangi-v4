import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Lightbulb, CheckCircle2, Bookmark, Calendar } from "lucide-react";

interface SummaryData {
    title: string;
    themes: string[];
    emotional_journey: string;
    key_insight: string;
    suggestions: string[];
}

interface SummaryCardProps {
    data: SummaryData;
    onClose: () => void;
    onReset: () => void;
}

export default function SummaryCard({ data, onClose, onReset }: SummaryCardProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-[#0F172A] border border-slate-700 w-full max-w-2xl rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header - Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                >
                    ✕
                </button>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    {/* Title Section */}
                    <motion.div variants={item}>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                            <Calendar size={12} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
                            {data.title}
                        </h2>
                    </motion.div>

                    {/* Themes */}
                    <motion.div variants={item} className="flex flex-wrap gap-2">
                        {data.themes.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </motion.div>

                    <div className="h-px bg-slate-800 my-4" />

                    {/* Insight Card */}
                    <motion.div variants={item} className="bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/20 rounded-xl p-5 relative">
                        <Lightbulb className="absolute top-4 right-4 text-yellow-500/50" size={20} />
                        <h3 className="text-sm font-semibold text-blue-300 mb-2 uppercase tracking-wide">Key Insight</h3>
                        <p className="text-lg text-slate-200 font-medium italic">
                            "{data.key_insight}"
                        </p>
                    </motion.div>

                    {/* Emotional Journey */}
                    <motion.div variants={item} className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                            <ArrowRight size={14} /> The Journey
                        </h3>
                        <p className="text-slate-300 leading-relaxed text-base">
                            {data.emotional_journey}
                        </p>
                    </motion.div>

                    {/* Suggestions */}
                    <motion.div variants={item} className="bg-slate-900/50 rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                            <Bookmark size={14} /> Takeaways
                        </h3>
                        <div className="space-y-2">
                            {data.suggestions.map((sug, i) => (
                                <div key={i} className="flex items-start gap-3 text-slate-300">
                                    <CheckCircle2 size={18} className="text-green-500/70 mt-0.5 shrink-0" />
                                    <span>{sug}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-[#0F172A] flex justify-end gap-3 z-10">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition"
                >
                    Close
                </button>
                <button
                    onClick={onReset}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
                >
                    <Sparkles size={16} /> Start Fresh
                </button>
            </div>
        </div>
    );
}
