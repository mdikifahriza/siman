"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<{ sender: "user" | "ai"; text: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chats]);

  const handleSend = async () => {
    if (!message) return;
    setChats((p) => [...p, { sender: "user", text: message }]);
    setLoading(true);

    const formData = new FormData();
    formData.append("message", message);

    setMessage("");

    try {
      const res = await fetch("/api/ai", { method: "POST", body: formData });
      const data = await res.json();
      setChats((p) => [...p, { sender: "ai", text: data.result || "Tidak ada respons." }]);
    } catch {
      setChats((p) => [...p, { sender: "ai", text: "⚠️ Terjadi kesalahan koneksi." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 pt-6"
        >
          <div className="flex items-center justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-green-600 mr-2" />
            <h1 className="text-4xl font-bold text-green-800">Konsultasi AI</h1>
          </div>
          <p className="text-gray-600">Tanya tentang pertanian dengan AI</p>
        </motion.div>

        {/* Chat area */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white rounded-2xl shadow-xl mb-4 p-4">
          {chats.map((chat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative px-4 py-2 max-w-[80%] rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed 
                  ${
                    chat.sender === "user"
                      ? "bg-green-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
              >
                {chat.text}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-2xl text-sm shadow-sm animate-pulse">
                Mengetik...
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </main>

        {/* Input area */}
        <footer className="bg-white rounded-2xl shadow-xl p-4">
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              className="w-full border border-gray-300 bg-transparent rounded-lg p-3 resize-none text-sm focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="Ketik pertanyaanmu di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex gap-2">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-3 rounded-lg transition-all duration-200 flex-1"
                >
                  Kembali
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-3 rounded-lg transition-all duration-200 flex-1"
              >
                {loading ? "Mengirim..." : "Kirim"}
              </motion.button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
