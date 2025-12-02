"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CameraPage() {
  const router = useRouter();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const openCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (error) { 
        console.error('Camera error:', error);
        alert('Akses kamera ditolak atau tidak tersedia.');
        router.push('/');
      }
    };

    openCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [router]);

  const capturePhoto = () => {
    if (videoRef.current && isCameraReady) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Simpan ke sessionStorage
        sessionStorage.setItem('uploadedImage', imageData);
        sessionStorage.setItem('imageSource', 'camera');
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Navigate to hasil
        router.push('/hasil');
      }
    }
  };

  const handleBack = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    router.push('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent z-10 p-4 safe-top">
        <button
          onClick={handleBack}
          className="flex items-center text-white hover:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          <span className="font-semibold">Kembali</span>
        </button>
      </div>

      {/* Video Preview */}
      <div className="relative w-full h-full">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-sm">Memuat kamera...</p>
            </div>
          </div>
        )}

        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-4 border-white border-dashed opacity-30 m-8 rounded-lg"></div>
            <div className="absolute top-24 left-0 right-0 text-center">
              <p className="text-white text-sm bg-black/50 inline-block px-3 py-1 rounded">
                Posisikan daun dalam frame
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pb-8 safe-bottom">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={capturePhoto}
          disabled={!isCameraReady}
          className="w-20 h-20 mx-auto block bg-white rounded-full border-4 border-green-500 disabled:opacity-50 disabled:border-gray-400 shadow-lg relative overflow-hidden"
        >
          <motion.div
            animate={isCameraReady ? { scale: [1, 0.95, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-2 rounded-full bg-green-500"
          />
        </motion.button>
        <p className="text-white text-center mt-3 text-sm">Ketuk untuk mengambil foto</p>
      </div>
    </motion.div>
  );
}