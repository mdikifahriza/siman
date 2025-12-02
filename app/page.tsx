"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, History, Leaf, Cloud, MessageCircle, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        // Simpan ke sessionStorage untuk diambil di halaman hasil
        sessionStorage.setItem('uploadedImage', imageData);
        sessionStorage.setItem('imageSource', 'upload');
        router.push('/hasil');
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-6"
        >
          <div className="flex items-center justify-center mb-4">
            <Leaf className="w-12 h-12 text-green-600 mr-2" />
            <h1 className="text-4xl font-bold text-green-800">SiMan</h1>
          </div>
          <p className="text-gray-600">Sistem Deteksi Penyakit Tanaman</p>
        </motion.div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow"
          >
            <Upload className="w-10 h-10 md:w-12 md:h-12 text-green-600 mb-3" />
            <span className="text-base md:text-lg font-semibold text-gray-800">Upload Foto</span>
            <span className="text-xs text-gray-500 mt-1">Pilih dari galeri</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/camera')}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow"
          >
            <Camera className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mb-3" />
            <span className="text-base md:text-lg font-semibold text-gray-800">Ambil Foto</span>
            <span className="text-xs text-gray-500 mt-1">Buka kamera</span>
          </motion.button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/history')}
            className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <History className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-semibold text-gray-800">Riwayat</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/cuaca')}
            className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <Cloud className="w-8 h-8 text-cyan-600 mb-2" />
            <span className="text-sm font-semibold text-gray-800">Cuaca</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/chat')}
            className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <MessageCircle className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="text-sm font-semibold text-gray-800">Konsultasi AI</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/kalkulator')}
            className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <Calculator className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-semibold text-gray-800">Kalkulator</span>
          </motion.button>
        </div>

        {/* Time and Date Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Waktu Sekarang</h2>
          <div className="text-4xl md:text-6xl font-mono text-green-600 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-lg md:text-xl text-gray-700">
            {formatDate(currentTime)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
