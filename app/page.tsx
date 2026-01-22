"use client";

import ChatBubble, { Block } from "./components/ChatBubble";
import SummaryCard from "./components/SummaryCard";
import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon, Loader2, Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

// --- TYPES ---
type Message = {
  role: "user" | "assistant";
  content: string;
  blocks?: Block[];
};

type Profile = {
  name: string;
  age_range: string;
  role: string;
  topic_focus: string[];
  support_style: string;
};

type SessionMeta = {
  id: string;
  title: string;
  date: string;
};

const THINKING_PHRASES = [
  "Reviewing recent context...",
  "Noticing important themes...",
  "Preparing a thoughtful reply...",
  "Reflecting on what you've shared...",
  "Holding the bigger picture...",
  "Responding with care..."
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://huggingface.co/spaces/Heyattrangi-spaces/Bot-Heyattrangi-V4";

export default function Home() {
  // --- STATE ---
  const [sessionId, setSessionId] = useState("");
  const [step, setStep] = useState<"onboarding" | "chat">("onboarding");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [expression, setExpression] = useState("NEUTRAL");
  const [summary, setSummary] = useState<any>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    age_range: "",
    role: "",
    topic_focus: [],
    support_style: ""
  });
  const [sessions, setSessions] = useState<SessionMeta[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- EFFECT: SESSION INIT & RESUME ---
  useEffect(() => {
    let sid = localStorage.getItem("attrangi_session_id");
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem("attrangi_session_id", sid);
    }
    setSessionId(sid);

    // Fetch History
    fetch(`${API_BASE}/history/${sid}`)
      .then(res => res.json())
      .then(data => {
        if (data.conversation && data.conversation.length > 0) {
          setMessages(data.conversation);
          // If we have history, skip onboarding
          setStep("chat");
        }
      })
      .catch(err => console.error("History fetch failed", err));

    // Load Session List
    const savedSessions = localStorage.getItem("attrangi_sessions_list");
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // --- ACTIONS ---
  // --- ACTIONS ---
  const resetChat = () => {
    localStorage.removeItem("attrangi_session_id");
    const newId = uuidv4();
    setSessionId(newId);
    localStorage.setItem("attrangi_session_id", newId);
    setMessages([]);
    setStep("onboarding");
    setOnboardingStep(0);
    setProfile({ name: "", age_range: "", role: "", topic_focus: [], support_style: "" });
    setExpression("NEUTRAL");
  };

  const handleSummary = async () => {
    setSummaryLoading(true);
    setIsSummaryOpen(true);
    try {
      const res = await fetch(`${API_BASE}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      });
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const switchSession = (sid: string) => {
    setSessionId(sid);
    localStorage.setItem("attrangi_session_id", sid);
    setLoading(true);

    fetch(`${API_BASE}/history/${sid}`)
      .then(res => res.json())
      .then(data => {
        if (data.conversation && data.conversation.length > 0) {
          setMessages(data.conversation);
          setStep("chat");
        } else {
          setMessages([]);
          setStep("onboarding");
          setOnboardingStep(0);
        }
      })
      .finally(() => setLoading(false));
  };

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- ONBOARDING ACTIONS ---
  const handleNext = () => setOnboardingStep((p) => p + 1);
  const handleBack = () => setOnboardingStep((p) => p - 1);

  const finishOnboarding = async () => {
    try {
      await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, profile })
      });
      setStep("chat");
    } catch (e) {
      console.error("Failed to save profile", e);
      // Allow proceed anyway
      setStep("chat");
    }
  };

  const toggleTopic = (topic: string) => {
    setProfile(p => {
      const exists = p.topic_focus.includes(topic);
      return {
        ...p,
        topic_focus: exists
          ? p.topic_focus.filter(t => t !== topic)
          : [...p.topic_focus, topic]
      };
    });
  };

  // --- CHAT ACTIONS ---
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(p => [...p, { role: "user", content: userMsg }]);
    setLoading(true);
    setThinkingText(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    setExpression("DEFAULT");

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMsg })
      });
      const data = await res.json();

      setMessages(p => [...p, {
        role: "assistant",
        content: data.reply,
        blocks: data.blocks
      }]);
      setExpression(data.expression || "NEUTRAL");

      // Update Session Title if it's the first message
      if (messages.length === 0) {
        const newTitle = userMsg.slice(0, 30) + (userMsg.length > 30 ? "..." : "");
        const newMeta = { id: sessionId, title: newTitle, date: new Date().toLocaleDateString() };

        setSessions(prev => {
          // Avoid duplicates
          if (prev.find(s => s.id === sessionId)) return prev;
          const updated = [newMeta, ...prev];
          localStorage.setItem("attrangi_sessions_list", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      setMessages(p => [...p, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderOnboarding = () => {
    // STEP 1: ABOUT YOU
    if (onboardingStep === 0) return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-100">About You</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name (Optional)</label>
            <input
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 outline-none focus:border-blue-500 transition"
              placeholder="What should I call you?"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Age Range</label>
            <div className="flex flex-wrap gap-2">
              {["under_18", "18-25", "26-35", "36-50", "50+"].map(a => (
                <button
                  key={a}
                  onClick={() => setProfile({ ...profile, age_range: a })}
                  className={`px-4 py-2 rounded-full text-sm border transition ${profile.age_range === a
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                    }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Role</label>
            <select
              value={profile.role}
              onChange={e => setProfile({ ...profile, role: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 outline-none"
            >
              <option value="">Select a Role</option>
              <option value="student">Student</option>
              <option value="working_professional">Working Professional</option>
              <option value="caregiver">Caregiver</option>
              <option value="patient">Patient</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            Next <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    );

    // STEP 2: FOCUS
    if (onboardingStep === 1) return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-100">What's on your mind?</h2>
        <p className="text-slate-400">Select as many as you like.</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            "myself", "someone important to me", "work or studies",
            "health", "relationships", "something unclear", "just thinking out loud"
          ].map(t => (
            <button
              key={t}
              onClick={() => toggleTopic(t)}
              className={`p-4 rounded-xl border text-left flex justify-between items-center transition ${profile.topic_focus.includes(t)
                ? "bg-blue-900/30 border-blue-500 text-blue-100"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                }`}
            >
              {t}
              {profile.topic_focus.includes(t) && <Check size={18} className="text-blue-400" />}
            </button>
          ))}
        </div>
        <div className="flex justify-between pt-4">
          <button onClick={handleBack} className="text-slate-400 hover:text-white px-4 py-2 flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            Next <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    );

    // STEP 3: STYLE
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-100">How can I help?</h2>
        <div className="space-y-3">
          {[
            { id: "listen", label: "Just Listen", desc: "I'll hear you out and validate your feelings." },
            { id: "reflect", label: "Reflect", desc: "I'll help you see patterns and clarify thoughts." },
            { id: "help me think", label: "Help Me Think", desc: "We'll brainstorm or untangle a problem." },
            { id: "answer directly", label: "Answer Directly", desc: "No fluff, just straight answers." }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setProfile({ ...profile, support_style: s.id })}
              className={`w-full p-4 rounded-xl border text-left transition ${profile.support_style === s.id
                ? "bg-blue-900/30 border-blue-500"
                : "bg-slate-800 border-slate-700 hover:bg-slate-750"
                }`}
            >
              <div className={`font-medium ${profile.support_style === s.id ? "text-blue-100" : "text-slate-200"}`}>{s.label}</div>
              <div className="text-sm text-slate-500">{s.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-between pt-4">
          <button onClick={handleBack} className="text-slate-400 hover:text-white px-4 py-2 flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>
          <button
            onClick={finishOnboarding}
            disabled={!profile.support_style}
            className={`px-8 py-3 rounded-lg font-medium transition ${profile.support_style
              ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
          >
            Start Chatting
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* --- LAYOUT GRID --- */}
      <div className="flex h-screen overflow-hidden">

        {/* --- SIDEBAR --- */}
        <div className="w-[400px] bg-[#020617] border-r border-slate-800 hidden lg:flex flex-col p-6 shadow-2xl z-10">
          <div className="mb-4 text-center pt-2">
            <h1 className="text-2xl font-semibold text-white tracking-wide">Hey Attrangi</h1>
          </div>

          {/* AVATAR (Moved to Top) */}
          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <div className="relative group w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl opacity-30 blur-lg transition duration-500 group-hover:opacity-50"></div>
              <img
                src={`/bot_expressions/${expression}.jpg`}
                alt="Bot Expression"
                className="relative w-full h-auto rounded-3xl shadow-2xl border-4 border-[#0F172A]"
                onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
              />
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <span className={`w-2 h-2 rounded-full ${expression === 'NEUTRAL' ? 'bg-slate-500' : 'bg-green-500 animate-pulse'}`}></span>
                {expression} MODE
              </div>
            </div>
          </div>

          <button
            onClick={resetChat}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg py-3 px-4 mb-3 flex items-center justify-center gap-2 transition font-medium"
          >
            <Loader2 size={18} className={loading ? "animate-spin" : ""} /> Reset Chat
          </button>

          <button
            onClick={handleSummary}
            className="w-full bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border border-blue-800/50 rounded-lg py-3 px-4 mb-4 flex items-center justify-center gap-2 transition font-medium"
          >
            <Sparkles size={18} /> End & Summarize
          </button>

          <div className="mt-auto text-xs text-slate-500 text-center leading-relaxed">
            I am an AI mental health companion. <br />
            I can listen, reflect, and support you. <br />
            <span className="text-slate-600">I am not a replacement for professional help.</span>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col relative">

          {step === "onboarding" ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                  {renderOnboarding()}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT AREA */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-6 scroll-smooth">
                {messages.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className="w-full"
                  >
                    <ChatBubble
                      role={m.role}
                      content={m.content}
                      blocks={m.blocks}
                      isLatest={i === messages.length - 1}
                    />
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                    <div className="flex items-center gap-3 bg-[#1E293B]/50 px-4 py-3 rounded-full border border-slate-800/50">
                      <Loader2 className="animate-spin text-blue-500" size={18} />
                      <span className="text-sm text-slate-400 italic animate-pulse">{thinkingText}</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-4 lg:p-6 bg-[#0F172A] border-t border-slate-800/50">

                <div className="max-w-4xl mx-auto relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative flex gap-2">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="What's been on your mind?"
                      className="w-full bg-[#1E293B] border border-slate-700 text-slate-100 rounded-xl p-4 pr-12 text-lg focus:outline-none focus:border-blue-500/50 focus:bg-slate-800 transition shadow-inner resize-none overflow-hidden"
                      rows={1}
                      style={{ minHeight: "60px" }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      className="absolute right-3 top-3 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition shadow-md"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
                <div className="text-center mt-3 text-xs text-slate-600">
                  Attrangi can make mistakes. Please check important info.
                </div>
              </div>
            </>
          )}
        </div>
      </div>


      {/* SUMMARY MODAL */}
      <AnimatePresence>
        {isSummaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl">
                <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                <p className="text-slate-400 animate-pulse text-sm">Synthesizing conversation themes...</p>
              </div>
            ) : (
              <SummaryCard
                data={summary ? (typeof summary === 'string' ? JSON.parse(summary) : summary) : null}
                onClose={() => setIsSummaryOpen(false)}
                onReset={() => {
                  setIsSummaryOpen(false);
                  resetChat();
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
