"use client"; // Tambahkan ini di atas untuk menandai sebagai Client Component

import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs'; // Import Tensorflow
import { Camera, Upload, History, X, AlertCircle, CheckCircle, Leaf, BookOpen, FlaskConical, Sprout, Cloud, MessageCircle } from 'lucide-react';

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
  [key: string]: any;
}

const PlantDiseaseDetector = () => {
  const [diseasesData, setDiseasesData] = useState<Disease[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null); // State model
  const [modelLoading, setModelLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<Disease | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCamera, setIsCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false); // State baru untuk indikator capturing

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/data.json');
      const data = await response.json();
      // Akses array diseases dari objek
      const diseases = data.diseases as Disease[];
      // Pastikan data diurutkan berdasarkan ID agar index array cocok dengan index prediksi
      const sortedData = diseases.sort((a, b) => a.id - b.id);
      setDiseasesData(sortedData);
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Gagal mengambil data penyakit:", error);
    }
  };

  // Load TFJS Model
  const loadModel = async () => {
    try {
      // Ganti URL sesuai lokasi file model.json di folder public
      const loadedModel = await tf.loadLayersModel('/model/model.json');
      setModel(loadedModel);
      setModelLoading(false);
      console.log("Model loaded successfully");
    } catch (error) {
      console.error("Gagal memuat model:", error);
      setModelLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadModel();
    const saved = loadHistory();
    setHistory(saved);
  }, []);

  const saveToHistory = (result: Disease) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      result: result,
      image: selectedImage
    };
    const updatedHistory = [newEntry, ...history].slice(0, 20); 
    setHistory(updatedHistory);
    localStorage.setItem('plantHistory', JSON.stringify(updatedHistory));
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('plantHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) { return []; }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDetectionResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGIKA UTAMA DETEKSI ---
  const analyzeImage = async () => {
    // Cek apakah gambar ada, model sudah load, dan referensi elemen gambar valid
    if (!selectedImage || !model || !imageRef.current) {
        alert("Model belum siap atau gambar belum dipilih.");
        return;
    }
    
    setIsAnalyzing(true);
    
    try {
        // tf.tidy membersihkan tensor intermediate secara otomatis
        const predictions = tf.tidy(() => {
            // 1. Ambil gambar dari elemen <img>
            const img = tf.browser.fromPixels(imageRef.current!);
            
            // 2. Preprocessing (Sesuaikan dengan cara Anda melatih model!)
            // Contoh standar: Resize ke 224x224, Normalisasi 0-1, Expand Dimensi
            return img
                .resizeNearestNeighbor([224, 224]) // Ganti [224, 224] sesuai input shape model Anda
                .toFloat()
                .div(tf.scalar(255.0))
                .expandDims();
        });

        // 3. Inference
        const predictionResult = model.predict(predictions);
        // Pastikan predictionResult adalah Tensor tunggal, bukan array
        const output = await (predictionResult as tf.Tensor).data();
        
        // 4. Cari index dengan nilai tertinggi
        const maxProbability = Math.max(...output);
        const maxIndex = output.indexOf(maxProbability);
        
        console.log(`Prediksi Index: ${maxIndex}, Confidence: ${maxProbability}`);

        // 5. Cocokkan index dengan data JSON
        // Kita asumsikan array diseasesData index-nya sinkron dengan output model (0-37)
        const identifiedData = diseasesData.find(d => d.id === maxIndex);

        if (identifiedData) {
            const result = {
                ...identifiedData,
                confidence: (maxProbability * 100).toFixed(2)
            };
            setDetectionResult(result);
            saveToHistory(result);
        } else {
            alert("Terdeteksi kelas yang tidak ada di database.");
        }

        // Cleanup input tensor manual (karena diluar tf.tidy wrapper async)
        predictions.dispose();

    } catch (error) {
        console.error("Error prediction:", error);
        alert("Gagal melakukan deteksi.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- Fitur Kamera ---
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCamera(true);
        setIsCapturing(true); // Mulai indikator capturing

        // Tunggu video loaded, lalu capture otomatis
        videoRef.current.addEventListener('loadeddata', () => {
          setTimeout(() => {
            capturePhoto();
          }, 500); // Delay kecil untuk memastikan stabil
        });
      }
    } catch (error) { 
      alert('Akses kamera ditolak.'); 
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);
      
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCamera(false);
      setIsCapturing(false);
      setDetectionResult(null);
    }
  };

  // --- Helper UI ---
  const deleteHistoryItem = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('plantHistory', JSON.stringify(updated));
  };

  // Navigasi ke Cuaca (internal)
  const goToWeather = () => {
    window.location.href = '/cuaca';
  };

  // Navigasi ke Konsultasi AI (eksternal)
  const goToAIConsultation = () => {
    window.open('https://aipertanianpercobaan.vercel.app/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="w-12 h-12 text-green-600 mr-2" />
            <h1 className="text-4xl font-bold text-green-800">SiMan</h1>
          </div>
          <p className="text-gray-600">
            {modelLoading ? "Sedang memuat model AI..." : "Sistem Deteksi Penyakit Tanaman"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6">
          {/* Buttons - Diubah untuk lebih rapi di mobile: grid-cols-2 md:grid-cols-5, gap lebih kecil di mobile */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-6">
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-3 md:p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg">
              <Upload className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" /> <span className="text-xs md:text-sm">Upload</span>
            </button>
            <button onClick={openCamera} className="flex flex-col items-center p-3 md:p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg">
              <Camera className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" /> <span className="text-xs md:text-sm">Kamera</span>
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="flex flex-col items-center p-3 md:p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all shadow-lg">
              <History className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" /> <span className="text-xs md:text-sm">Riwayat</span>
            </button>
            <button onClick={goToWeather} className="flex flex-col items-center p-3 md:p-4 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-all shadow-lg">
              <Cloud className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" /> <span className="text-xs md:text-sm">Cuaca</span>
            </button>
            <button onClick={goToAIConsultation} className="flex flex-col items-center p-3 md:p-4 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg">
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" /> <span className="text-xs md:text-sm">Konsultasi AI</span>
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          {/* Camera UI - Diubah: tanpa tombol, dengan indikator capturing */}
          {isCamera && (
            <div className="mb-6 relative">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg shadow-inner" />
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Mengambil gambar...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Image & Analyze Button */}
          {selectedImage && !isCamera && (
            <div className="mb-6 animate-fade-in">
              {/* PENTING: Tambahkan ref={imageRef} disini */}
              <img 
                ref={imageRef} 
                src={selectedImage} 
                alt="Selected" 
                className="w-full h-48 md:h-64 lg:h-80 object-cover rounded-lg shadow-md border-2 border-green-100"
                crossOrigin="anonymous"
              />
              
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing || modelLoading || !isDataLoaded}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex justify-center items-center"
              >
                {isAnalyzing ? "Menganalisis..." : modelLoading ? "Menunggu Model..." : "Deteksi Penyakit"}
              </button>
            </div>
          )}

          {/* Result UI - Grid diubah untuk lebih rapi di mobile: gap lebih kecil, padding disesuaikan */}
          {detectionResult && (
            <div className="border-t-2 border-dashed border-gray-200 pt-4 md:pt-6 mt-6 animate-slide-up">
              <div className="flex flex-col md:flex-row items-start md:items-center mb-4 bg-green-50 p-3 md:p-4 rounded-xl border border-green-100">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 mr-2 md:mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">{detectionResult.nama}</h2>
                  <p className="text-xs md:text-sm text-gray-600 italic">ID: {detectionResult.id} | Tanaman: {detectionResult.tanaman}</p>
                </div>
                <div className="mt-2 md:mt-0 md:ml-auto bg-white px-3 md:px-4 py-1 md:py-2 rounded-full shadow-sm border border-green-200">
                  <span className="text-base md:text-lg font-bold text-green-700">{(detectionResult as any).confidence}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gray-50 p-3 md:p-4 rounded-xl">
                    <h4 className="flex items-center font-semibold mb-2 text-sm md:text-base"><BookOpen className="w-4 h-4 mr-2" /> Detail</h4>
                    <p className="text-xs md:text-sm text-gray-600">{detectionResult.detail}</p>
                </div>
                <div className="bg-orange-50 p-3 md:p-4 rounded-xl">
                    <h4 className="flex items-center font-semibold mb-2 text-sm md:text-base"><AlertCircle className="w-4 h-4 mr-2" /> Pencegahan</h4>
                    <ul className="list-disc list-inside text-xs md:text-sm text-gray-600">{detectionResult.pencegahan?.map((p,i)=><li key={i}>{p}</li>)}</ul>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-xl">
                    <h4 className="flex items-center font-semibold mb-2 text-sm md:text-base"><FlaskConical className="w-4 h-4 mr-2" /> Kimia</h4>
                    <ul className="list-disc list-inside text-xs md:text-sm text-gray-600">
                      {detectionResult.solusiKimia?.map((s, i) => (
                        <li key={i}>
                          <strong>{s.merk}</strong> ({s.bahanAktif}): {s.dosis}, {s.cara}
                        </li>
                      ))}
                    </ul>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-xl">
                    <h4 className="flex items-center font-semibold mb-2 text-sm md:text-base"><Sprout className="w-4 h-4 mr-2" /> Tradisional</h4>
                    <ul className="list-disc list-inside text-xs md:text-sm text-gray-600">{detectionResult.solusiTradisional?.map((s,i)=><li key={i}>{s}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* History Panel - Padding dan gap disesuaikan untuk mobile */}
        {showHistory && (
             <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mt-6">
                <h2 className="text-xl font-bold mb-4">Riwayat</h2>
                 <div className="space-y-2 md:space-y-3 max-h-60 overflow-y-auto">
                    {history.map(h => (
                        <div key={h.id} className="flex gap-2 md:gap-3 border-b pb-2">
                             <img src={h.image} className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0" />
                             <div className="flex-1 min-w-0">
                                 <p className="font-bold text-sm md:text-base truncate">{h.result.nama}</p>
                                 <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleDateString()}</p>
                             </div>
                            <button onClick={()=>deleteHistoryItem(h.id)} className="ml-auto text-red-500 flex-shrink-0"><X size={16}/></button>
                        </div>
                    ))}
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};
export default PlantDiseaseDetector;
