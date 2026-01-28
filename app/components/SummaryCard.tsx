import { motion } from "framer-motion";
import { Sparkles, Calendar } from "lucide-react";

interface SummaryCardProps {
    report: string;
    onClose: () => void;
    onReset: () => void;
}

export default function SummaryCard({ report, onClose, onReset }: SummaryCardProps) {
    return (
        <div className="bg-[#0F172A] border border-slate-700 w-full max-w-3xl rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header - Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                >
                    ✕
                </button>

                <div className="space-y-6">
                    {/* Title Section */}
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                            <Calendar size={12} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
                            Clinical Report
                        </h2>
                    </div>

                    <div className="h-px bg-slate-800 my-4" />

                    {/* Report Content */}
                    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700 shadow-inner">
                        <pre className="whitespace-pre-wrap font-sans text-slate-300 text-sm leading-relaxed">
                            {report || "No report generated."}
                        </pre>
                    </div>
                </div>
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
