import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";

interface Message {
  role: "user" | "bot";
  content: string;
}

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "¡Hola! Soy VET-AI 🐾 Cuéntame qué le pasa a tu mascota (qué ocurrió, especie y desde cuándo) y te doy primeros auxilios paso a paso hasta que llegues al veterinario.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await api.getEmergencyAdvice(userMsg, messages);
      // VALIDACIÓN CRÍTICA: Si response o reply no existen, usamos un fallback
      const replyText =
        response?.reply ||
        "Lo siento, no recibí una respuesta válida de la IA.";
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: String(replyText) },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "⚠️ " +
            (err?.message ||
              "No pude conectarme con el servidor de inteligencia artificial."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 20,
              transformOrigin: "bottom right",
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-7rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          >
            <header className="bg-gradient-to-r from-primary to-emerald-500 p-6 text-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icons.Activity size={24} className="animate-pulse" />
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tighter">
                      Asistente VET-AI
                    </h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase">
                      Emergencias 24/7
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-black/10 p-2 rounded-full transition-colors"
                >
                  <Icons.X size={20} />
                </button>
              </div>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
            >
              {messages.map((msg, i) => (
                <div
                  key={`msg-${i}`}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700",
                    )}
                  >
                    {/* FALLBACK TOTAL: Si content es null o undefined, mostramos string vacío */}
                    {String(msg?.content || "")
                      .split("\n")
                      .map((line, j) => (
                        <p
                          key={j}
                          className={
                            line.startsWith("⚠️")
                              ? "text-amber-500 font-bold mb-1"
                              : ""
                          }
                        >
                          {line}
                        </p>
                      ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe la emergencia..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-4 pr-12 py-3 text-sm outline-none text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-2 bg-primary text-slate-900 rounded-xl disabled:opacity-50"
                >
                  <Icons.ArrowUpRight size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110",
          isOpen ? "bg-slate-900 text-white" : "bg-primary text-slate-900",
        )}
      >
        {isOpen ? <Icons.X size={30} /> : <Icons.Activity size={30} />}
      </button>
    </div>
  );
};
