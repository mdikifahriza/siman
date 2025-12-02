"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tf from '@tensorflow/tfjs';
import { ArrowLeft, History, Home, CheckCircle, AlertCircle, BookOpen, FlaskConical, Sprout, ExternalLink, ZoomIn, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SolusiKimia {
  merk: string;
  bahanAktif: string;
  dosis: string;
  cara: string;
}

interface LinkEdukasi {
  judul: string;
  url: string;
  tipe: string;
}

interface Disease {
  id: number;
  nama: string;
  tanaman: string;
  gambar: string;
  detail: string;
  gejala: string[];
  pencegahan: string[];
  solusiKimia: SolusiKimia[];
  solusiTradisional: string[];
  linkEdukasi: LinkEdukasi[];
}

export default function HasilPage() {
  const router = useRouter();
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<Disease | null>(null);
  const [diseasesData, setDiseasesData] = useState<Disease[]>([]);
  const [imageSource, setImageSource] = useState<string>('');
  const [confidence, setConfidence] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Load data.json
    const fetchData = async () => {
      try {
        const response = await fetch('/data.json');
        const data = await response.json();
        const diseases = data.diseases as Disease[];
        const sortedData = diseases.sort((a, b) => a.id - b.id);
        setDiseasesData(sortedData);
      } catch (error) {
        console.error("Gagal mengambil data penyakit:", error);
      }
    };

    // Load model
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel('/model/model.json');
        setModel(loadedModel);
        setModelLoading(false);
      } catch (error) {
        console.error("Gagal memuat model:", error);
        setModelLoading(false);
      }
    };

    fetchData();
    loadModel();

    // Get image and source from sessionStorage
    const source = sessionStorage.getItem('imageSource') || '';
    setImageSource(source);

    if (source === 'history') {
      // Dari history - langsung tampilkan data
      const historyImage = sessionStorage.getItem('historyImage');
      const diseaseId = sessionStorage.getItem('historyDiseaseId');
      
      if (historyImage) setSelectedImage(historyImage);
      
      // Load disease data by ID
      if (diseaseId) {
        fetchData().then(() => {
          const disease = diseasesData.find(d => d.id === parseInt(diseaseId));
          if (disease) setDetectionResult(disease);
        });
      }
    } else {
      // Dari upload/camera - perlu deteksi
      const uploadedImage = sessionStorage.getItem('uploadedImage');
      if (uploadedImage) {
        setSelectedImage(uploadedImage);
      } else {
        router.push('/');
      }
    }
  }, []);

  // Auto analyze ketika model ready dan image dari upload/camera
  useEffect(() => {
    if (model && !modelLoading && selectedImage && imageSource !== 'history' && diseasesData.length > 0 && !detectionResult) {
      analyzeImage();
    }
  }, [model, modelLoading, selectedImage, imageSource, diseasesData]);

  // Load disease by ID for history
  useEffect(() => {
    if (imageSource === 'history' && diseasesData.length > 0 && !detectionResult) {
      const diseaseId = sessionStorage.getItem('historyDiseaseId');
      if (diseaseId) {
        const disease = diseasesData.find(d => d.id === parseInt(diseaseId));
        if (disease) setDetectionResult(disease);
      }
    }
  }, [diseasesData, imageSource]);

  const analyzeImage = async () => {
    if (!selectedImage || !model || !imageRef.current || !diseasesData.length) return;
    
    setIsAnalyzing(true);
    
    try {
      const predictions = tf.tidy(() => {
        const img = tf.browser.fromPixels(imageRef.current!);
        return img
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(tf.scalar(255.0))
          .expandDims();
      });

      const predictionResult = model.predict(predictions);
      const output = await (predictionResult as tf.Tensor).data();
      
      const maxProbability = Math.max(...output);
      const maxIndex = output.indexOf(maxProbability);
      
      const identifiedData = diseasesData.find(d => d.id === maxIndex);

      if (identifiedData) {
        const confidenceValue = (maxProbability * 100).toFixed(2);
        setConfidence(confidenceValue);
        setDetectionResult(identifiedData);
        saveToHistory(identifiedData, confidenceValue);
      } else {
        alert("Terdeteksi kelas yang tidak ada di database.");
      }

      predictions.dispose();
    } catch (error) {
      console.error("Error prediction:", error);
      alert("Gagal melakukan deteksi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToHistory = (result: Disease, conf: string) => {
    try {
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        diseaseId: result.id,
        diseaseName: result.nama,
        image: selectedImage,
        confidence: conf
      };
      
      const saved = localStorage.getItem('plantHistory');
      const history = saved ? JSON.parse(saved) : [];
      const updatedHistory = [newEntry, ...history].slice(0, 20);
      localStorage.setItem('plantHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  if (!selectedImage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tidak ada gambar yang dipilih</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 pt-4"
        >
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-green-700 hover:text-green-900 transition-colors bg-white px-3 py-2 rounded-lg shadow-sm"
            >
              <Home className="w-5 h-5 mr-1" />
              <span className="font-semibold text-sm">Beranda</span>
            </button>
            
            {imageSource === 'history' && (
              <button
                onClick={() => router.push('/history')}
                className="flex items-center text-purple-700 hover:text-purple-900 transition-colors bg-white px-3 py-2 rounded-lg shadow-sm"
              >
                <History className="w-5 h-5 mr-1" />
                <span className="font-semibold text-sm">Riwayat</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Image Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6"
        >
          <div className="relative">
            <img 
              ref={imageRef} 
              src={selectedImage} 
              alt="Selected" 
              className="w-full aspect-square object-cover rounded-lg shadow-md border-2 border-green-100 cursor-pointer"
              crossOrigin="anonymous"
              onClick={() => setShowImageModal(true)}
            />
            <button
              onClick={() => setShowImageModal(true)}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          {isAnalyzing && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Menganalisis gambar...</p>
            </div>
          )}
        </motion.div>

        {/* Result */}
        {detectionResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-4 md:p-6"
          >
            {/* Header Result */}
            <div className="flex flex-col md:flex-row items-start md:items-center mb-6 bg-green-50 p-4 rounded-xl border border-green-100">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3 flex-shrink-0" />
              <div className="flex-1 mt-2 md:mt-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{detectionResult.nama}</h2>
                <p className="text-sm text-gray-600 italic">Tanaman: {detectionResult.tanaman}</p>
              </div>
              {confidence && (
                <div className="mt-3 md:mt-0 md:ml-auto bg-white px-4 py-2 rounded-full shadow-sm border border-green-200">
                  <span className="text-lg font-bold text-green-700">{confidence}%</span>
                </div>
              )}
            </div>
            
            {/* Detail Sections */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Detail */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="flex items-center font-semibold mb-2 text-base">
                  <BookOpen className="w-5 h-5 mr-2 text-gray-700" /> Detail Penyakit
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{detectionResult.detail}</p>
              </div>

              {/* Gejala */}
              {detectionResult.gejala && detectionResult.gejala.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <h4 className="flex items-center font-semibold mb-2 text-base">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-700" /> Gejala
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {detectionResult.gejala.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              )}

              {/* Pencegahan */}
              {detectionResult.pencegahan && detectionResult.pencegahan.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <h4 className="flex items-center font-semibold mb-2 text-base">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-700" /> Pencegahan
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {detectionResult.pencegahan.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* Solusi Kimia */}
              {detectionResult.solusiKimia && detectionResult.solusiKimia.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="flex items-center font-semibold mb-2 text-base">
                    <FlaskConical className="w-5 h-5 mr-2 text-blue-700" /> Solusi Kimia
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {detectionResult.solusiKimia.map((s, i) => (
                      <li key={i} className="bg-white p-2 rounded-lg">
                        <strong className="text-blue-800">{s.merk}</strong>
                        <span className="text-gray-600"> ({s.bahanAktif})</span>
                        <p className="text-xs text-gray-600 mt-1">Dosis: {s.dosis}</p>
                        <p className="text-xs text-gray-600">Cara: {s.cara}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Solusi Tradisional */}
              {detectionResult.solusiTradisional && detectionResult.solusiTradisional.length > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <h4 className="flex items-center font-semibold mb-2 text-base">
                    <Sprout className="w-5 h-5 mr-2 text-green-700" /> Solusi Tradisional
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {detectionResult.solusiTradisional.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Link Edukatif */}
            {detectionResult.linkEdukasi && detectionResult.linkEdukasi.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-base flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2 text-indigo-600" />
                  Sumber Edukatif
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {detectionResult.linkEdukasi.map((link, i) => (
                    <motion.a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-indigo-800 truncate">{link.judul}</p>
                        <p className="text-xs text-indigo-600">{link.tipe}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-indigo-600 ml-2 flex-shrink-0" />
                    </motion.a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}