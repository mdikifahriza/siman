'use client';

import React, { useState, useEffect } from 'react';

// === INTERFACE UNTUK TYPING ===

// 1. Tipe data untuk koordinat
interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

// 2. Tipe data untuk hasil lokasi Geolocation API
interface LocationState {
  coords: Coordinates;
  status: 'loading' | 'success' | 'denied' | 'unsupported' | 'error';
  error: string | null;
}

// 3. Tipe data untuk hasil data cuaca (disesuaikan untuk Open-Meteo)
interface WeatherData {
    temp: number;
    description: string; 
    emoji: string;      
    humidity: number;
    windSpeed: number;
    city: string; 
    country: string;
}

// === WMO CODE MAPPING (Untuk menerjemahkan kode cuaca numerik ke teks dan emoji) ===
const WMO_MAPPING: { [key: string]: { description: string; emoji: string } } = {
  0: { description: 'Cerah', emoji: '☀️' },
  1: { description: 'Sebagian Cerah', emoji: '🌤️' },
  2: { description: 'Berawan', emoji: '☁️' },
  3: { description: 'Sangat Berawan', emoji: '☁️' },
  45: { description: 'Kabut', emoji: '🌫️' },
  51: { description: 'Gerimis Ringan', emoji: '🌦️' },
  53: { description: 'Gerimis Sedang', emoji: '🌧️' },
  61: { description: 'Hujan Ringan', emoji: '🌧️' },
  63: { description: 'Hujan Sedang', emoji: '🌧️' },
  65: { description: 'Hujan Lebat', emoji: '⛈️' },
  80: { description: 'Hujan Ringan', emoji: '🌧️' },
  81: { description: 'Hujan Sedang', emoji: '🌧️' },
  82: { description: 'Hujan Deras', emoji: '⛈️' },
  95: { description: 'Badai Petir', emoji: '🌩️' },
  // Default untuk kode lain
  default: { description: 'Kondisi Cuaca Lain', emoji: '❓' }
};

/**
 * Mendapatkan deskripsi dan emoji dari kode WMO.
 */
const getWeatherInfoFromCode = (code: number) => {
    return WMO_MAPPING[code] || WMO_MAPPING.default;
};


/**
 * Komponen Utama yang menggunakan Geolocation API (Browser/Client-Side)
 * dan API terbuka (Nominatim & Open-Meteo) untuk mendapatkan data cuaca.
 */
export default function GeolocationPage() {
  // State untuk status Geolocation browser (Lintang/Bujur)
  const [locationState, setLocationState] = useState<LocationState>({
    coords: { latitude: null, longitude: null },
    status: 'loading',
    error: null,
  });

  // State untuk data cuaca dan status pengambilan data
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');

  // ***************************************************************
  // EFFECT 1: MENDAPATKAN KOORDINAT DARI BROWSER
  // ***************************************************************
  useEffect(() => {
    // Memastikan API tersedia
    if (!navigator.geolocation) {
      setLocationState(prev => ({ 
        ...prev, 
        status: 'unsupported', 
        error: 'Geolocation API tidak didukung oleh browser Anda.',
      }));
      return;
    }

    const successCallback = (position: GeolocationPosition) => {
      setLocationState({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        status: 'success',
        error: null,
      });
    };

    const errorCallback = (error: GeolocationPositionError) => {
      const errorMessage = (
        error.code === error.PERMISSION_DENIED ? 
        'Akses lokasi ditolak oleh pengguna. Mohon izinkan akses lokasi di browser Anda.' : 
        'Gagal mendapatkan lokasi: ' + error.message
      );
      
      setLocationState({
        coords: { latitude: null, longitude: null },
        status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error',
        error: errorMessage,
      });
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } 
    );
  }, []); 

  // ***************************************************************
  // EFFECT 2: MENGAMBIL DATA CUACA SETELAH KOORDINAT DIDAPATKAN
  // ***************************************************************
  useEffect(() => {
    if (locationState.status !== 'success' || weatherStatus !== 'idle') {
      return;
    }

    const { latitude, longitude } = locationState.coords;
    if (latitude === null || longitude === null) return;

    const fetchWeather = async () => {
        setWeatherStatus('fetching');

        let city = 'Lokasi Tak Dikenal';
        let country = 'Negara Tak Dikenal';

        try {
            // 1. Reverse Geocoding (Nominatim OpenStreetMap) untuk mendapatkan nama kota
            // PENTING: Nominatim memiliki batasan penggunaan wajar. 
            // Jangan memanggilnya terlalu sering.
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=10`;
            const geoRes = await fetch(nominatimUrl, { headers: { 'User-Agent': 'WeatherAppDemo' } });
            const geoData = await geoRes.json();
            
            if (geoRes.ok && geoData.address) {
                // Mengambil nama kota/area yang paling spesifik
                city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || 'Tidak Diketahui';
                country = geoData.address.country || 'Tidak Diketahui';
            }

            // 2. Fetch Data Cuaca Saat Ini (Open-Meteo)
            // Mengambil suhu, kelembaban, kode cuaca, dan kecepatan angin
            const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&windspeed_unit=ms&timezone=auto&forecast_days=1`;
            const weatherRes = await fetch(openMeteoUrl);
            const weatherData = await weatherRes.json();

            if (weatherRes.ok && weatherData.current) {
                const current = weatherData.current;
                const weatherInfo = getWeatherInfoFromCode(current.weather_code);

                setWeather({
                    temp: current.temperature_2m,
                    description: weatherInfo.description,
                    emoji: weatherInfo.emoji,
                    humidity: current.relative_humidity_2m,
                    windSpeed: current.wind_speed_10m,
                    city: city, 
                    country: country,
                });
                setWeatherStatus('success');
            } else {
                setWeatherStatus('failed');
                setLocationState(prev => ({ 
                    ...prev, 
                    error: `Gagal memuat data cuaca: ${weatherData.reason || 'Respons API Open-Meteo tidak valid.'}`,
                }));
            }

        } catch (e) {
            console.error(e);
            setWeatherStatus('failed');
            setLocationState(prev => ({ 
                ...prev, 
                error: 'Terjadi kesalahan saat berkomunikasi dengan API Geocoding atau Cuaca.',
            }));
        }
    };

    fetchWeather();
    
  }, [locationState.status, locationState.coords]); 

  // ***************************************************************
  // LOGIKA TAMPILAN
  // ***************************************************************

  const renderContent = () => {
    // Tampilkan pesan error Geolocation atau API Key
    if (locationState.status === 'unsupported' || locationState.status === 'denied' || locationState.error) {
        return <p className="text-red-600 font-medium p-4 border border-red-200 bg-red-50 rounded-lg">{locationState.error}</p>;
    }

    // Tampilkan status pencarian lokasi
    if (locationState.status === 'loading') {
      return <p className="text-gray-600 animate-pulse">Menunggu izin lokasi dan mendeteksi lokasi Anda...</p>;
    }
    
    // Tampilkan status pencarian cuaca
    if (weatherStatus === 'fetching') {
        return (
            <div className="text-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-600">Mendeteksi lokasi dan memuat data cuaca...</p>
            </div>
        );
    }

    // Tampilkan card cuaca setelah berhasil
    if (weatherStatus === 'success' && weather) {
        
        return (
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-2xl shadow-2xl p-6 md:p-8 transform transition duration-500 hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-4xl font-extrabold">{weather.city}, {weather.country}</h2>
                    <p className="text-lg font-light capitalize">{weather.description}</p>
                </div>
                {/* Menampilkan Emoji Cuaca */}
                <span className="text-6xl p-2 bg-white/30 rounded-full shadow-lg">
                    {weather.emoji}
                </span>
            </div>

            <div className="text-8xl font-light mb-6 flex items-start">
                {Math.round(weather.temp)}
                <span className="text-4xl font-medium mt-1">°C</span>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/30 pt-4">
                <WeatherDetail icon="💧" label="Kelembaban" value={`${weather.humidity}%`} />
                <WeatherDetail icon="💨" label="Angin" value={`${weather.windSpeed} m/s`} />
                <WeatherDetail 
                    icon="📍" 
                    label="Koordinat" 
                    value={`${locationState.coords.latitude!.toFixed(2)} / ${locationState.coords.longitude!.toFixed(2)}`} 
                />
            </div>
          </div>
        );
    }

    return (
        <p className="text-gray-500 p-4 border rounded-lg">Silakan klik "Izinkan" di pop-up browser untuk mendeteksi lokasi Anda.</p>
    );
  };


  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">
          Aplikasi Cuaca Otomatis (Open Source API)
        </h1>
        
        {renderContent()}

        {/* Tampilkan Lintang/Bujur asli untuk debugging */}
        {locationState.coords.latitude !== null && locationState.coords.longitude !== null && (
            <div className="text-xs text-gray-500 pt-4 text-center">
                <p>Status Browser: **{locationState.status.toUpperCase()}**</p>
                <p>Koordinat Aktual: Lintang {locationState.coords.latitude.toFixed(6)}, Bujur {locationState.coords.longitude.toFixed(6)}</p>
            </div>
        )}
      </div>
    </main>
  );
}

// Komponen kecil untuk menampilkan detail cuaca
interface WeatherDetailProps {
  label: string;
  value: string;
  icon: string;
}

const WeatherDetail: React.FC<WeatherDetailProps> = ({ label, value, icon }) => (
  <div className="flex flex-col items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
    <span className="text-2xl mb-1">{icon}</span>
    <p className="text-xs opacity-80">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);