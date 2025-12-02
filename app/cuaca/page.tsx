'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Cloud, Droplets, Wind, MapPin, RefreshCw, Eye, Gauge, Sun, CloudRain, Thermometer, CloudSnow, Sunrise, Sunset, Compass, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

// === INTERFACE ===
interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

interface LocationState {
  coords: Coordinates;
  status: 'loading' | 'success' | 'denied' | 'unsupported' | 'error';
  error: string | null;
}

interface WeatherData {
    temp: number;
    description: string; 
    emoji: string;      
    humidity: number;
    windSpeed: number;
    windDirection: number;
    city: string; 
    country: string;
    // Extended data
    apparentTemp: number;
    pressure: number;
    cloudCover: number;
    visibility: number;
    dewPoint: number;
    precipitation: number;
    weatherCode: number;
    uvIndex: number;
    windGusts: number;
    // Daily data
    sunrise: string;
    sunset: string;
    tempMax: number;
    tempMin: number;
    precipProbability: number;
}

// === WMO CODE MAPPING ===
const WMO_MAPPING: { [key: string]: { description: string; emoji: string } } = {
  0: { description: 'Cerah', emoji: '☀️' },
  1: { description: 'Sebagian Cerah', emoji: '🌤️' },
  2: { description: 'Berawan Sebagian', emoji: '⛅' },
  3: { description: 'Berawan', emoji: '☁️' },
  45: { description: 'Berkabut', emoji: '🌫️' },
  48: { description: 'Kabut Tebal', emoji: '🌫️' },
  51: { description: 'Gerimis Ringan', emoji: '🌦️' },
  53: { description: 'Gerimis Sedang', emoji: '🌧️' },
  55: { description: 'Gerimis Lebat', emoji: '🌧️' },
  56: { description: 'Gerimis Beku Ringan', emoji: '🌧️' },
  57: { description: 'Gerimis Beku Lebat', emoji: '🌧️' },
  61: { description: 'Hujan Ringan', emoji: '🌧️' },
  63: { description: 'Hujan Sedang', emoji: '🌧️' },
  65: { description: 'Hujan Lebat', emoji: '⛈️' },
  66: { description: 'Hujan Beku Ringan', emoji: '🌧️' },
  67: { description: 'Hujan Beku Lebat', emoji: '🌧️' },
  71: { description: 'Salju Ringan', emoji: '🌨️' },
  73: { description: 'Salju Sedang', emoji: '❄️' },
  75: { description: 'Salju Lebat', emoji: '❄️' },
  77: { description: 'Butiran Salju', emoji: '🌨️' },
  80: { description: 'Hujan Rintik Ringan', emoji: '🌦️' },
  81: { description: 'Hujan Rintik Sedang', emoji: '🌧️' },
  82: { description: 'Hujan Rintik Deras', emoji: '⛈️' },
  85: { description: 'Salju Ringan', emoji: '🌨️' },
  86: { description: 'Salju Lebat', emoji: '❄️' },
  95: { description: 'Badai Petir', emoji: '⛈️' },
  96: { description: 'Badai Petir & Hujan Es Ringan', emoji: '⛈️' },
  99: { description: 'Badai Petir & Hujan Es Lebat', emoji: '⛈️' },
  default: { description: 'Tidak Diketahui', emoji: '❓' }
};

const getWeatherInfoFromCode = (code: number) => {
    return WMO_MAPPING[code] || WMO_MAPPING.default;
};

const getWindDirection = (degrees: number) => {
  const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

const getUVIndexLevel = (uv: number) => {
  if (uv <= 2) return { level: 'Rendah', color: 'text-green-600', bg: 'bg-green-50' };
  if (uv <= 5) return { level: 'Sedang', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  if (uv <= 7) return { level: 'Tinggi', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (uv <= 10) return { level: 'Sangat Tinggi', color: 'text-red-600', bg: 'bg-red-50' };
  return { level: 'Ekstrem', color: 'text-purple-600', bg: 'bg-purple-50' };
};

export default function CuacaPage() {
  const router = useRouter();
  
  const [locationState, setLocationState] = useState<LocationState>({
    coords: { latitude: null, longitude: null },
    status: 'loading',
    error: null,
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');

  useEffect(() => {
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
        'Akses lokasi ditolak. Mohon izinkan akses lokasi di browser Anda.' : 
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
            // 1. Reverse Geocoding
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&zoom=10`;
            const geoRes = await fetch(nominatimUrl, { headers: { 'User-Agent': 'WeatherAppDemo' } });
            const geoData = await geoRes.json();
            
            if (geoRes.ok && geoData.address) {
                city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || 'Tidak Diketahui';
                country = geoData.address.country || 'Tidak Diketahui';
            }

            // 2. Fetch Extended Weather Data
            const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=visibility,dew_point_2m,uv_index&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&windspeed_unit=ms&timezone=auto&forecast_days=1`;
            const weatherRes = await fetch(openMeteoUrl);
            const weatherData = await weatherRes.json();

            if (weatherRes.ok && weatherData.current && weatherData.daily) {
                const current = weatherData.current;
                const hourly = weatherData.hourly;
                const daily = weatherData.daily;
                const weatherInfo = getWeatherInfoFromCode(current.weather_code);

                setWeather({
                    temp: current.temperature_2m,
                    description: weatherInfo.description,
                    emoji: weatherInfo.emoji,
                    humidity: current.relative_humidity_2m,
                    windSpeed: current.wind_speed_10m,
                    windDirection: current.wind_direction_10m,
                    city: city, 
                    country: country,
                    apparentTemp: current.apparent_temperature,
                    pressure: current.pressure_msl,
                    cloudCover: current.cloud_cover,
                    visibility: hourly.visibility?.[0] || 10000,
                    dewPoint: hourly.dew_point_2m?.[0] || 0,
                    precipitation: current.precipitation,
                    weatherCode: current.weather_code,
                    uvIndex: hourly.uv_index?.[0] || 0,
                    windGusts: current.wind_gusts_10m,
                    sunrise: daily.sunrise[0],
                    sunset: daily.sunset[0],
                    tempMax: daily.temperature_2m_max[0],
                    tempMin: daily.temperature_2m_min[0],
                    precipProbability: daily.precipitation_probability_max?.[0] || 0
                });
                setWeatherStatus('success');
            } else {
                setWeatherStatus('failed');
                setLocationState(prev => ({ 
                    ...prev, 
                    error: `Gagal memuat data cuaca: ${weatherData.reason || 'Respons API tidak valid.'}`,
                }));
            }

        } catch (e) {
            console.error(e);
            setWeatherStatus('failed');
            setLocationState(prev => ({ 
                ...prev, 
                error: 'Terjadi kesalahan saat berkomunikasi dengan API.',
            }));
        }
    };

    fetchWeather();
    
  }, [locationState.status, locationState.coords]); 

  const refreshWeather = () => {
    setWeatherStatus('idle');
    setWeather(null);
    setLocationState({
      coords: { latitude: null, longitude: null },
      status: 'loading',
      error: null,
    });
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationState({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            status: 'success',
            error: null,
          });
        },
        (error) => {
          const errorMessage = error.code === error.PERMISSION_DENIED ? 
            'Akses lokasi ditolak.' : 'Gagal mendapatkan lokasi: ' + error.message;
          
          setLocationState({
            coords: { latitude: null, longitude: null },
            status: error.code === error.PERMISSION_DENIED ? 'denied' : 'error',
            error: errorMessage,
          });
        }
      );
    }
  };

  const renderContent = () => {
    if (locationState.status === 'unsupported' || locationState.status === 'denied' || locationState.error) {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
          >
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <p className="text-red-700 font-medium">{locationState.error}</p>
            <button
              onClick={refreshWeather}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          </motion.div>
        );
    }

    if (locationState.status === 'loading') {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Mendeteksi lokasi Anda...</p>
        </motion.div>
      );
    }
    
    if (weatherStatus === 'fetching') {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-cyan-600 font-medium">Memuat data cuaca...</p>
          </motion.div>
        );
    }

    if (weatherStatus === 'success' && weather) {
        const uvInfo = getUVIndexLevel(weather.uvIndex);
        
        return (
          <div className="space-y-4">
            {/* Main Weather Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h2 className="text-3xl font-bold mb-1">{weather.city}</h2>
                      <p className="text-base font-light opacity-90">{weather.country}</p>
                      <p className="text-sm capitalize mt-1 opacity-80">{weather.description}</p>
                  </div>
                  <motion.span 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-6xl p-3 bg-white/20 rounded-full shadow-lg backdrop-blur-sm"
                  >
                      {weather.emoji}
                  </motion.span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="text-7xl font-light flex items-start">
                    {Math.round(weather.temp)}
                    <span className="text-3xl font-medium mt-2">°C</span>
                </div>
                <div className="text-sm space-y-1 mt-2">
                  <p className="opacity-90">Terasa: {Math.round(weather.apparentTemp)}°C</p>
                  <p className="opacity-90">Min: {Math.round(weather.tempMin)}°C | Max: {Math.round(weather.tempMax)}°C</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-white/30 pt-4">
                  <WeatherDetail 
                    icon={<Droplets className="w-5 h-5" />} 
                    label="Kelembaban" 
                    value={`${weather.humidity}%`} 
                  />
                  <WeatherDetail 
                    icon={<Wind className="w-5 h-5" />} 
                    label="Angin" 
                    value={`${weather.windSpeed.toFixed(1)} m/s`} 
                  />
                  <WeatherDetail 
                      icon={<CloudRain className="w-5 h-5" />} 
                      label="Hujan" 
                      value={`${weather.precipProbability}%`} 
                  />
              </div>
            </motion.div>

            {/* Extended Weather Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Detail Cuaca</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailCard
                  icon={<Thermometer className="w-5 h-5 text-orange-600" />}
                  label="Titik Embun"
                  value={`${Math.round(weather.dewPoint)}°C`}
                />
                <DetailCard
                  icon={<Gauge className="w-5 h-5 text-purple-600" />}
                  label="Tekanan"
                  value={`${Math.round(weather.pressure)} hPa`}
                />
                <DetailCard
                  icon={<Cloud className="w-5 h-5 text-gray-600" />}
                  label="Awan"
                  value={`${weather.cloudCover}%`}
                />
                <DetailCard
                  icon={<Eye className="w-5 h-5 text-blue-600" />}
                  label="Jarak Pandang"
                  value={`${(weather.visibility / 1000).toFixed(1)} km`}
                />
                <DetailCard
                  icon={<Compass className="w-5 h-5 text-cyan-600" />}
                  label="Arah Angin"
                  value={getWindDirection(weather.windDirection)}
                  sub={`${Math.round(weather.windDirection)}°`}
                />
                <DetailCard
                  icon={<Zap className="w-5 h-5 text-yellow-600" />}
                  label="Hembusan"
                  value={`${weather.windGusts.toFixed(1)} m/s`}
                />
              </div>
            </motion.div>

            {/* UV Index & Sun Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`${uvInfo.bg} rounded-2xl shadow-lg p-6`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sun className={`w-6 h-6 ${uvInfo.color}`} />
                  <h3 className="text-lg font-bold text-gray-800">Indeks UV</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${uvInfo.color}`}>
                    {weather.uvIndex.toFixed(1)}
                  </span>
                  <span className={`text-sm font-semibold ${uvInfo.color}`}>
                    {uvInfo.level}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-3">Matahari</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Sunrise className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600">Terbit</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(weather.sunrise).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sunset className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-600">Terbenam</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(weather.sunset).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={refreshWeather}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
              Perbarui Data Cuaca
            </motion.button>
          </div>
        );
    }

    return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center"
        >
          <Cloud className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Silakan izinkan akses lokasi untuk melihat cuaca</p>
        </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-6 pt-4"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-cyan-700 hover:text-cyan-900 transition-colors bg-white px-3 py-2 rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            <span className="font-semibold">Beranda</span>
          </button>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center mb-2">
            <Cloud className="w-10 h-10 text-cyan-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Info Cuaca</h1>
          </div>
          <p className="text-gray-600 text-sm">Data cuaca lengkap berdasarkan lokasi Anda</p>
        </motion.div>
        
        {renderContent()}

        {/* Debug info */}
        {locationState.coords.latitude !== null && locationState.coords.longitude !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 mt-6 text-center bg-white/50 backdrop-blur-sm p-3 rounded-lg"
            >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MapPin className="w-3 h-3" />
                  <p>Koordinat: {locationState.coords.latitude.toFixed(6)}, {locationState.coords.longitude.toFixed(6)}</p>
                </div>
                <p className="text-[10px] opacity-75">Data dari Open-Meteo API</p>
            </motion.div>
        )}
      </div>
    </div>
  );
}

// Weather Detail Component (for main card)
interface WeatherDetailProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const WeatherDetail: React.FC<WeatherDetailProps> = ({ label, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center p-3 bg-white/20 rounded-xl backdrop-blur-sm"
  >
    <div className="mb-2 opacity-90">{icon}</div>
    <p className="text-xs opacity-80 mb-1">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </motion.div>
);

// Detail Card Component (for extended details)
interface DetailCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ icon, label, value, sub }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
  >
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-xs text-gray-600 font-medium">{label}</p>
    </div>
    <p className="text-lg font-bold text-gray-800">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </motion.div>
);