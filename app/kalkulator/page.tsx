"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Sprout, 
  Info, 
  TrendingUp, 
  Droplets,
  Sun,
  ThermometerSun,
  MapPin,
  Leaf,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Interface untuk data tanaman
interface Tanaman {
  nama: string;
  npk: { n: number; p: number; k: number };
  fase: {
    vegetatif: { n: number; p: number; k: number };
    generatif: { n: number; p: number; k: number };
  };
  umur: number;
  hasil: number;
}

// Interface untuk data pupuk
interface Pupuk {
  nama: string;
  n: number;
  p: number;
  k: number;
  harga: number;
}

// Interface untuk data pH tanah
interface PhTanah {
  range: string;
  faktor: number;
  wilayah: string;
}

// Interface untuk data iklim
interface Iklim {
  curahHujan: string;
  faktor: number;
}

// Interface untuk hasil perhitungan
interface Hasil {
  kebutuhan: { n: number; p: number; k: number };
  pupuk: {
    rekomendasi1: {
      nama: string;
      items: { jenis: string; jumlah: number; biaya: number }[];
      totalBiaya: number;
    };
    rekomendasi2: {
      nama: string;
      items: { jenis: string; jumlah: number; biaya: number }[];
      totalBiaya: number;
    };
  };
  estimasiHasil: number;
  jadwalPemupukan: { minggu: number; deskripsi: string; n: number; p: number; k: number }[];
}

// Data tanaman populer di Indonesia dengan kebutuhan NPK
const tanamanData: Record<string, Tanaman> = {
  padi: {
    nama: 'Padi',
    npk: { n: 120, p: 60, k: 60 },
    fase: {
      vegetatif: { n: 50, p: 30, k: 20 },
      generatif: { n: 70, p: 30, k: 40 }
    },
    umur: 120,
    hasil: 5000
  },
  jagung: {
    nama: 'Jagung',
    npk: { n: 250, p: 100, k: 100 },
    fase: {
      vegetatif: { n: 100, p: 50, k: 40 },
      generatif: { n: 150, p: 50, k: 60 }
    },
    umur: 100,
    hasil: 8000
  },
  cabai: {
    nama: 'Cabai',
    npk: { n: 180, p: 90, k: 120 },
    fase: {
      vegetatif: { n: 60, p: 30, k: 40 },
      generatif: { n: 120, p: 60, k: 80 }
    },
    umur: 90,
    hasil: 15000
  },
  tomat: {
    nama: 'Tomat',
    npk: { n: 200, p: 100, k: 150 },
    fase: {
      vegetatif: { n: 80, p: 40, k: 50 },
      generatif: { n: 120, p: 60, k: 100 }
    },
    umur: 80,
    hasil: 20000
  },
  kedelai: {
    nama: 'Kedelai',
    npk: { n: 50, p: 90, k: 75 },
    fase: {
      vegetatif: { n: 20, p: 45, k: 30 },
      generatif: { n: 30, p: 45, k: 45 }
    },
    umur: 85,
    hasil: 2000
  },
  kentang: {
    nama: 'Kentang',
    npk: { n: 180, p: 120, k: 200 },
    fase: {
      vegetatif: { n: 90, p: 60, k: 80 },
      generatif: { n: 90, p: 60, k: 120 }
    },
    umur: 90,
    hasil: 25000
  },
  bawangMerah: {
    nama: 'Bawang Merah',
    npk: { n: 150, p: 100, k: 150 },
    fase: {
      vegetatif: { n: 75, p: 50, k: 60 },
      generatif: { n: 75, p: 50, k: 90 }
    },
    umur: 65,
    hasil: 12000
  },
  tebu: {
    nama: 'Tebu',
    npk: { n: 200, p: 80, k: 120 },
    fase: {
      vegetatif: { n: 120, p: 50, k: 60 },
      generatif: { n: 80, p: 30, k: 60 }
    },
    umur: 365,
    hasil: 80000
  }
};

// Data jenis pupuk dengan kandungan NPK
const pupukData: Record<string, Pupuk> = {
  urea: { nama: 'Urea', n: 46, p: 0, k: 0, harga: 2500 },
  za: { nama: 'ZA', n: 21, p: 0, k: 0, harga: 1800 },
  sp36: { nama: 'SP-36', n: 0, p: 36, k: 0, harga: 2300 },
  tsp: { nama: 'TSP', n: 0, p: 46, k: 0, harga: 2800 },
  kcl: { nama: 'KCl', n: 0, p: 0, k: 60, harga: 3500 },
  npk: { nama: 'NPK Phonska', n: 15, p: 15, k: 15, harga: 2400 },
  npkMutiara: { nama: 'NPK Mutiara', n: 16, p: 16, k: 16, harga: 2600 },
  organik: { nama: 'Pupuk Organik', n: 2, p: 2, k: 2, harga: 800 }
};

// Data pH tanah untuk berbagai wilayah Indonesia
const phTanah: Record<string, PhTanah> = {
  asam: { range: '4.0-5.5', faktor: 0.7, wilayah: 'Sumatra, Kalimantan' },
  agakAsam: { range: '5.5-6.5', faktor: 0.85, wilayah: 'Jawa Barat, Sulawesi' },
  netral: { range: '6.5-7.5', faktor: 1.0, wilayah: 'Jawa Tengah, Jawa Timur' },
  alkalin: { range: '7.5-8.5', faktor: 0.9, wilayah: 'NTB, NTT' }
};

// Faktor iklim
const iklimData: Record<string, Iklim> = {
  basah: { curahHujan: '>2000mm', faktor: 1.2 },
  sedang: { curahHujan: '1500-2000mm', faktor: 1.0 },
  kering: { curahHujan: '<1500mm', faktor: 0.8 }
};

const KalkulatorPupuk: React.FC = () => {
  const [tanaman, setTanaman] = useState<string>('padi');
  const [luas, setLuas] = useState<number>(1);
  const [targetProduksi, setTargetProduksi] = useState<number>(100);
  const [phTanahDipilih, setPhTanahDipilih] = useState<string>('netral');
  const [iklim, setIklim] = useState<string>('sedang');
  const [fase, setFase] = useState<string>('total');
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const hitungPupuk = (): void => {
    const dataTanaman = tanamanData[tanaman];
    const faktorPh = phTanah[phTanahDipilih].faktor;
    const faktorIklim = iklimData[iklim].faktor;
    const faktorTarget = targetProduksi / 100;

    let kebutuhanN: number, kebutuhanP: number, kebutuhanK: number;

    if (fase === 'total') {
      kebutuhanN = dataTanaman.npk.n * luas * 10 * faktorPh * faktorIklim * faktorTarget;
      kebutuhanP = dataTanaman.npk.p * luas * 10 * faktorPh * faktorIklim * faktorTarget;
      kebutuhanK = dataTanaman.npk.k * luas * 10 * faktorPh * faktorIklim * faktorTarget;
    } else {
      const faseData = dataTanaman.fase[fase as keyof typeof dataTanaman.fase];
      kebutuhanN = faseData.n * luas * 10 * faktorPh * faktorIklim * faktorTarget;
      kebutuhanP = faseData.p * luas * 10 * faktorPh * faktorIklim * faktorTarget;
      kebutuhanK = faseData.k * luas * 10 * faktorPh * faktorIklim * faktorTarget;
    }

    // Hitung kebutuhan pupuk
    const urea = (kebutuhanN / pupukData.urea.n) * 100;
    const sp36 = (kebutuhanP / pupukData.sp36.p) * 100;
    const kcl = (kebutuhanK / pupukData.kcl.k) * 100;
    const npkPhonska = Math.min(
      kebutuhanN / pupukData.npk.n,
      kebutuhanP / pupukData.npk.p,
      kebutuhanK / pupukData.npk.k
    ) * 100;

    // Hitung biaya
    const biayaUrea = (urea / 1000) * pupukData.urea.harga;
    const biayaSP36 = (sp36 / 1000) * pupukData.sp36.harga;
    const biayaKCl = (kcl / 1000) * pupukData.kcl.harga;
    const biayaNPK = (npkPhonska / 1000) * pupukData.npk.harga;

    // Estimasi hasil panen
    const estimasiHasil = dataTanaman.hasil * luas * faktorPh * faktorIklim * faktorTarget;

    setHasil({
      kebutuhan: { n: kebutuhanN, p: kebutuhanP, k: kebutuhanK },
      pupuk: {
        rekomendasi1: {
          nama: 'Sistem Pupuk Tunggal',
          items: [
            { jenis: 'Urea', jumlah: urea, biaya: biayaUrea },
            { jenis: 'SP-36', jumlah: sp36, biaya: biayaSP36 },
            { jenis: 'KCl', jumlah: kcl, biaya: biayaKCl }
          ],
          totalBiaya: biayaUrea + biayaSP36 + biayaKCl
        },
        rekomendasi2: {
          nama: 'Sistem NPK Phonska',
          items: [
            { jenis: 'NPK Phonska', jumlah: npkPhonska, biaya: biayaNPK }
          ],
          totalBiaya: biayaNPK
        }
      },
      estimasiHasil,
      jadwalPemupukan: generateJadwal(dataTanaman, fase)
    });
  };

  const generateJadwal = (dataTanaman: Tanaman, faseInput: string): { minggu: number; deskripsi: string; n: number; p: number; k: number }[] => {
    if (faseInput !== 'total') {
      return [{
        minggu: 0,
        deskripsi: `Pemupukan fase ${faseInput}`,
        n: dataTanaman.fase[faseInput as keyof typeof dataTanaman.fase].n,
        p: dataTanaman.fase[faseInput as keyof typeof dataTanaman.fase].p,
        k: dataTanaman.fase[faseInput as keyof typeof dataTanaman.fase].k
      }];
    }

    return [
      {
        minggu: 0,
        deskripsi: 'Pemupukan Dasar',
        n: dataTanaman.fase.vegetatif.n * 0.3,
        p: dataTanaman.fase.vegetatif.p,
        k: dataTanaman.fase.vegetatif.k * 0.3
      },
      {
        minggu: 3,
        deskripsi: 'Pemupukan Susulan I',
        n: dataTanaman.fase.vegetatif.n * 0.7,
        p: 0,
        k: dataTanaman.fase.vegetatif.k * 0.7
      },
      {
        minggu: 6,
        deskripsi: 'Pemupukan Susulan II',
        n: dataTanaman.fase.generatif.n * 0.5,
        p: dataTanaman.fase.generatif.p * 0.5,
        k: dataTanaman.fase.generatif.k * 0.5
      },
      {
        minggu: 9,
        deskripsi: 'Pemupukan Susulan III',
        n: dataTanaman.fase.generatif.n * 0.5,
        p: dataTanaman.fase.generatif.p * 0.5,
        k: dataTanaman.fase.generatif.k * 0.5
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
                <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              ← Kembali ke Beranda
            </motion.button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sprout className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              Kalkulator Pupuk Presisi
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Sistem perhitungan dosis pupuk akurat untuk pertanian Indonesia
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Card Tanaman */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Data Tanaman</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Tanaman
                  </label>
                  <select
                    value={tanaman}
                    onChange={(e) => setTanaman(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  >
                    {Object.entries(tanamanData).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Luas Lahan (Ha)
                  </label>
                  <input
                    type="number"
                    value={luas}
                    onChange={(e) => setLuas(parseFloat(e.target.value) || 0)}
                    min="0.1"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Produksi (%)
                  </label>
                  <input
                    type="number"
                    value={targetProduksi}
                    onChange={(e) => setTargetProduksi(parseInt(e.target.value) || 0)}
                    min="50"
                    max="150"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    100% = target normal, &gt;100% = intensifikasi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fase Pemupukan
                  </label>
                  <select
                    value={fase}
                    onChange={(e) => setFase(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="total">Total (Satu Musim)</option>
                    <option value="vegetatif">Fase Vegetatif</option>
                    <option value="generatif">Fase Generatif</option>                  </select>
                </div>
              </div>
            </div>

            {/* Card Kondisi Lahan */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Kondisi Lahan</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    pH Tanah
                  </label>
                  <select
                    value={phTanahDipilih}
                    onChange={(e) => setPhTanahDipilih(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    {Object.entries(phTanah).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.range} - {key.charAt(0).toUpperCase() + key.slice(1)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Wilayah: {phTanah[phTanahDipilih].wilayah}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kondisi Iklim
                  </label>
                  <select
                    value={iklim}
                    onChange={(e) => setIklim(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    {Object.entries(iklimData).map(([key, value]) => (
                      <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({value.curahHujan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={hitungPupuk}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Hitung Kebutuhan Pupuk
            </motion.button>
          </motion.div>

          {/* Hasil */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            <AnimatePresence>
              {hasil && (
                <>
                  {/* Info Kebutuhan NPK */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <h2 className="text-xl font-bold text-gray-800">
                        Kebutuhan Unsur Hara
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {hasil.kebutuhan.n.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">kg Nitrogen (N)</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {hasil.kebutuhan.p.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">kg Fosfor (P)</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {hasil.kebutuhan.k.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">kg Kalium (K)</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Rekomendasi Pupuk */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <h2 className="text-xl font-bold text-gray-800">
                        Rekomendasi Pupuk
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {/* Rekomendasi 1 */}
                      <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                            1
                          </span>
                          {hasil.pupuk.rekomendasi1.nama}
                        </h3>
                        <div className="space-y-2">
                          {hasil.pupuk.rekomendasi1.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-white rounded-lg p-3"
                            >
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {item.jenis}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.jumlah.toFixed(2)} kg
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  Rp {item.biaya.toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="bg-green-600 text-white rounded-lg p-3 flex justify-between items-center font-bold">
                            <span>Total Biaya</span>
                            <span>
                              Rp{' '}
                              {hasil.pupuk.rekomendasi1.totalBiaya.toLocaleString(
                                'id-ID'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rekomendasi 2 */}
                      <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                            2
                          </span>
                          {hasil.pupuk.rekomendasi2.nama}
                        </h3>
                        <div className="space-y-2">
                          {hasil.pupuk.rekomendasi2.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-white rounded-lg p-3"
                            >
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {item.jenis}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.jumlah.toFixed(2)} kg
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-blue-600">
                                  Rp {item.biaya.toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="bg-blue-600 text-white rounded-lg p-3 flex justify-between items-center font-bold">
                            <span>Total Biaya</span>
                            <span>
                              Rp{' '}
                              {hasil.pupuk.rekomendasi2.totalBiaya.toLocaleString(
                                'id-ID'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Jadwal Pemupukan */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowDetail(!showDetail)}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        <h2 className="text-xl font-bold text-gray-800">
                          Jadwal Pemupukan
                        </h2>
                      </div>
                      {showDetail ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <AnimatePresence>
                      {showDetail && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 space-y-3"
                        >
                          {hasil.jadwalPemupukan.map((jadwal, idx) => (
                            <div
                              key={idx}
                              className="border-2 border-teal-200 rounded-xl p-4 bg-teal-50"
                            >
                              <div className="flex items-start gap-3">
                                <div className="bg-teal-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                                  {jadwal.minggu}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-800 mb-1">
                                    Minggu ke-{jadwal.minggu}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {jadwal.deskripsi}
                                  </p>
                                  <div className="flex gap-4 text-sm">
                                    <span className="text-blue-600">
                                      N: {jadwal.n.toFixed(1)} kg/ha
                                    </span>
                                    <span className="text-orange-600">
                                      P: {jadwal.p.toFixed(1)} kg/ha
                                    </span>
                                    <span className="text-purple-600">
                                      K: {jadwal.k.toFixed(1)} kg/ha
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Estimasi Hasil */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sun className="w-5 h-5 text-amber-600" />
                      <h2 className="text-xl font-bold text-gray-800">
                        Estimasi Hasil Panen
                      </h2>
                    </div>

                    <div className="text-center">
                      <div className="text-4xl font-bold text-amber-600 mb-2">
                        {hasil.estimasiHasil.toFixed(2)} kg
                      </div>
                      <p className="text-gray-600">
                        Estimasi hasil panen berdasarkan kondisi lahan dan target produksi
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Droplets className="w-4 h-4" />
                          <span>Faktor pH: {phTanah[phTanahDipilih].faktor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThermometerSun className="w-4 h-4" />
                          <span>Faktor Iklim: {iklimData[iklim].faktor}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default KalkulatorPupuk;