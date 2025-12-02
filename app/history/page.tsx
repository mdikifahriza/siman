"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, History, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: number;
  timestamp: string;
  diseaseId: number;
  diseaseName: string;
  image: string;
  confidence?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('plantHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const deleteHistoryItem = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('plantHistory', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    if (confirm('Hapus semua riwayat?')) {
      setHistory([]);
      localStorage.removeItem('plantHistory');
    }
  };

  const openHistoryItem = (item: HistoryItem) => {
    // Simpan data ke sessionStorage untuk halaman hasil
    sessionStorage.setItem('historyImage', item.image);
    sessionStorage.setItem('historyDiseaseId', item.diseaseId.toString());
    sessionStorage.setItem('imageSource', 'history');
    router.push('/hasil');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 pt-4"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            <span className="font-semibold">Beranda</span>
          </button>
          
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="flex items-center text-red-600 hover:text-red-800 transition-colors text-sm"
            >
              <Trash2 className="w-5 h-5 mr-1" />
              <span>Hapus Semua</span>
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-4 md:p-6"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <History className="w-7 h-7 mr-2 text-purple-600" />
            Riwayat Deteksi
          </h2>
          
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500"
            >
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Belum ada riwayat deteksi</p>
              <p className="text-sm mt-2">Mulai deteksi penyakit tanaman Anda</p>
            </motion.div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openHistoryItem(item)}
                  className="flex gap-3 border border-gray-200 rounded-xl p-3 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer bg-white"
                >
                  <img 
                    src={item.image} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0 border-2 border-purple-100" 
                    alt="History" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm md:text-base text-gray-800 truncate">
                      {item.diseaseName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {item.confidence && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        Akurasi: {item.confidence}%
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistoryItem(item.id);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}