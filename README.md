# AstroByte - SolarGuard-TR

SolarGuard-TR, yaklaşan jeomanyetik fırtınaları erken tespit etmek için NOAA SWPC ve NASA DONKI verilerini birleştiren bir uzay havası erken uyarı platformudur. Proje; FastAPI tabanlı bir backend, React + Three.js tabanlı bir operasyon dashboard'u ve LSTM/XGBoost destekli tahmin hattından oluşur. Amaç, kritik uydu/yer altyapısı riskini gerçek zamanlı görünür hale getirerek operasyon ekiplerine hızlı karar desteği vermektir.

## Öne Çıkan Yetenekler

- Gerçek zamanlı uzay havası telemetrisi: Kp, güneş rüzgarı hızı, proton yoğunluğu, IMF Bz
- Kp tahmin serisi: NOAA tahmini + model tabanlı LSTM/XGBoost karşılaştırması
- Türkiye odaklı kritik varlık riski: TEDAŞ hub'ları, Türksat TT&C, araştırma istasyonları
- 3D Orbital görünüm: uydu/yeryüzü varlıkları ve risk katmanları
- Olay geçmişi ve flare izleme: NOAA + DONKI olaylarının panel entegrasyonu

## Mimari

- `solarguard-tr/`: FastAPI backend, veri işleme, NOAA/NASA client'ları, model eğitimi
- `solarguard-dashboard/`: React tabanlı kullanıcı arayüzü (Vite, Recharts, react-three-fiber)
- `solarguard-tr/models/`: eğitim scriptleri ve model dosyaları

## Teknoloji Yığını

- Backend: Python, FastAPI, Uvicorn, Pandas, NumPy, TensorFlow, XGBoost
- Frontend: React, Vite, Recharts, Three.js, @react-three/fiber, framer-motion
- Veri Kaynakları: NOAA SWPC, NASA DONKI

## Kurulum

### 1) Repo klonla

```bash
git clone https://github.com/nursedayavuz/AstroByte.git
cd AstroByte
```

### 2) Ortam değişkeni

Kök dizinde `.env` dosyası oluştur:

```env
NASA_API_KEY=YOUR_NASA_API_KEY
```

Notlar:
- Varsayılan olarak `DEMO_KEY` fallback'i vardır, ancak üretim/demo için kişisel NASA API key önerilir.
- `.env` dosyası `.gitignore` ile korunur.

### 3) Backend kurulumu

```bash
cd solarguard-tr
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api.main:app --reload
```

Backend varsayılan: `http://127.0.0.1:8000`

### 4) Frontend kurulumu

Yeni terminal:

```bash
cd solarguard-dashboard
npm install
npm run dev
```

Frontend varsayılan: `http://127.0.0.1:5173`

## Model Eğitimi

Model eğitimini çalıştırmak için:

```bash
cd solarguard-tr/models
python train_solar_guard.py
```

Beklenen çıktı:
- `best_lstm.keras` (eğitilen model)

Not:
- Büyük model/dataset artefaktları repoya dahil edilmez.

## Önemli API Endpointleri

- `GET /api/health` - servis sağlık kontrolü
- `GET /api/forecast-series` - Kp forecast zaman serisi
- `GET /api/telemetry-summary` - canlı telemetri özeti
- `GET /api/turkish-asset-risk` - Türkiye varlık risk raporu
- `GET /api/recent-flares` - son güneş patlamaları

Swagger UI: `http://127.0.0.1:8000/docs`

## Dashboard Sayfaları

- Orbital görünüm: 3D dünya, uydu/yer varlıkları, risk katmanları
- Tahminleme paneli: NOAA/LSTM/XGBoost Kp serisi
- Telemetri paneli: canlı uzay havası parametreleri
- Risk analiz paneli: Türkiye kritik altyapı etkilenme haritası

## Güvenlik ve Repo Politikası

- Gizli bilgiler `.env` içinde tutulur ve commit edilmez.
- Takip edilmeyen dosyalar:
  - `.env`, `.env.*`
  - model artefaktları (`*.keras`)
  - geçici/veri üretim çıktıları (`daily_*.csv`, `archive.zip`)

## Sorun Giderme

- Frontend açılmıyorsa backend çalışıyor mu kontrol et: `GET /api/health`
- Vite build sırasında native modül hatası alırsan Node.js ve bağımlılıkları temiz kur:
  - `rm -rf node_modules package-lock.json` (Windows için uygun alternatif)
  - `npm install`
- Tahmin grafiği boşsa `GET /api/forecast-series` yanıtını kontrol et

## Yol Haritası

- Gerçek sequence tabanlı LSTM inference pipeline'ı
- Model güven aralıklarının backend'de kalibre edilmesi
- Alarm motoru (eşik/olay bazlı notification policy)
- Operasyonel karar destek önerileri (kural + model hibrit)

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Ayrıntılar için `LICENSE` dosyasına bakın.
