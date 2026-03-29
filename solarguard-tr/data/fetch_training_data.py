"""
NOAA API'den eğitim veri seti oluşturma scripti
Bu script, güneş aktivitesi ve jeomanyetik verileri toplar ve CSV formatında kaydeder.
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import os
from typing import Dict, List, Optional

class NOAATrainingDataFetcher:
    """NOAA API'den eğitim verisi çeken sınıf"""
    
    def __init__(self):
        self.base_url = "https://services.swpc.noaa.gov/json"
        self.data_dir = "solarguard-tr/data/training_data"
        os.makedirs(self.data_dir, exist_ok=True)
    
    def fetch_kp_index(self, days: int = 365) -> pd.DataFrame:
        """
        NOAA'dan Kp indeks verilerini çeker
        
        Args:
            days: Çekilecek gün sayısı (varsayılan 365 gün = 1 yıl)
            
        Returns:
            Kp indeks verilerini içeren DataFrame
        """
        print(f"Kp indeks verileri çekiliyor (son {days} gün)...")
        
        try:
            # NOAA Kp indeks endpoint
            url = f"{self.base_url}/kp_index.json"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Veriyi DataFrame'e dönüştür
            df = pd.DataFrame(data)
            
            # Tarih sütununu datetime'a çevir
            if 'time_tag' in df.columns:
                df['time_tag'] = pd.to_datetime(df['time_tag'])
                df = df.sort_values('time_tag')
            
            # Son N günü filtrele
            cutoff_date = datetime.now() - timedelta(days=days)
            df = df[df['time_tag'] >= cutoff_date]
            
            print(f"✓ {len(df)} Kp indeks kaydı çekildi")
            return df
            
        except Exception as e:
            print(f"✗ Kp indeks verisi çekme hatası: {e}")
            return pd.DataFrame()
    
    def fetch_solar_wind(self, days: int = 365) -> pd.DataFrame:
        """
        NOAA'dan güneş rüzgarı verilerini çeker
        
        Args:
            days: Çekilecek gün sayısı
            
        Returns:
            Güneş rüzgarı verilerini içeren DataFrame
        """
        print(f"Güneş rüzgarı verileri çekiliyor (son {days} gün)...")
        
        try:
            # NOAA güneş rüzgarı endpoint
            url = f"{self.base_url}/solar-wind-plasma-1-hour.json"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            df = pd.DataFrame(data)
            
            # Tarih sütununu datetime'a çevir
            if 'time_tag' in df.columns:
                df['time_tag'] = pd.to_datetime(df['time_tag'])
                df = df.sort_values('time_tag')
            
            # Son N günü filtrele
            cutoff_date = datetime.now() - timedelta(days=days)
            df = df[df['time_tag'] >= cutoff_date]
            
            print(f"✓ {len(df)} güneş rüzgarı kaydı çekildi")
            return df
            
        except Exception as e:
            print(f"✗ Güneş rüzgarı verisi çekme hatası: {e}")
            return pd.DataFrame()
    
    def fetch_goes_xray(self, days: int = 365) -> pd.DataFrame:
        """
        NOAA'dan GOES X-ray flux verilerini çeker
        
        Args:
            days: Çekilecek gün sayısı
            
        Returns:
            GOES X-ray verilerini içeren DataFrame
        """
        print(f"GOES X-ray flux verileri çekiliyor (son {days} gün)...")
        
        try:
            # NOAA GOES X-ray endpoint
            url = f"{self.base_url}/goes-xray-flux-6-hour.json"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            df = pd.DataFrame(data)
            
            # Tarih sütununu datetime'a çevir
            if 'time_tag' in df.columns:
                df['time_tag'] = pd.to_datetime(df['time_tag'])
                df = df.sort_values('time_tag')
            
            # Son N günü filtrele
            cutoff_date = datetime.now() - timedelta(days=days)
            df = df[df['time_tag'] >= cutoff_date]
            
            print(f"✓ {len(df)} GOES X-ray kaydı çekildi")
            return df
            
        except Exception as e:
            print(f"✗ GOES X-ray verisi çekme hatası: {e}")
            return pd.DataFrame()
    
    def fetch_dst_index(self, days: int = 365) -> pd.DataFrame:
        """
        NOAA'dan Dst indeks verilerini çeker
        
        Args:
            days: Çekilecek gün sayısı
            
        Returns:
            Dst indeks verilerini içeren DataFrame
        """
        print(f"Dst indeks verileri çekiliyor (son {days} gün)...")
        
        try:
            # NOAA Dst indeks endpoint
            url = f"{self.base_url}/dst_index.json"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            df = pd.DataFrame(data)
            
            # Tarih sütununu datetime'a çevir
            if 'time_tag' in df.columns:
                df['time_tag'] = pd.to_datetime(df['time_tag'])
                df = df.sort_values('time_tag')
            
            # Son N günü filtrele
            cutoff_date = datetime.now() - timedelta(days=days)
            df = df[df['time_tag'] >= cutoff_date]
            
            print(f"✓ {len(df)} Dst indeks kaydı çekildi")
            return df
            
        except Exception as e:
            print(f"✗ Dst indeks verisi çekme hatası: {e}")
            return pd.DataFrame()
    
    def merge_datasets(self, kp_df: pd.DataFrame, solar_wind_df: pd.DataFrame, 
                      goes_df: pd.DataFrame, dst_df: pd.DataFrame) -> pd.DataFrame:
        """
        Tüm veri setlerini birleştirir
        
        Args:
            kp_df: Kp indeks verileri
            solar_wind_df: Güneş rüzgarı verileri
            goes_df: GOES X-ray verileri
            dst_df: Dst indeks verileri
            
        Returns:
            Birleştirilmiş veri seti
        """
        print("Veri setleri birleştiriliyor...")
        
        # Tüm veri setlerini time_tag üzerinde birleştir
        merged_df = kp_df.copy()
        
        if not solar_wind_df.empty:
            merged_df = pd.merge_asof(
                merged_df.sort_values('time_tag'),
                solar_wind_df.sort_values('time_tag'),
                on='time_tag',
                direction='nearest',
                suffixes=('', '_solar_wind')
            )
        
        if not goes_df.empty:
            merged_df = pd.merge_asof(
                merged_df.sort_values('time_tag'),
                goes_df.sort_values('time_tag'),
                on='time_tag',
                direction='nearest',
                suffixes=('', '_goes')
            )
        
        if not dst_df.empty:
            merged_df = pd.merge_asof(
                merged_df.sort_values('time_tag'),
                dst_df.sort_values('time_tag'),
                on='time_tag',
                direction='nearest',
                suffixes=('', '_dst')
            )
        
        # Sütunları temizle
        merged_df = merged_df.loc[:, ~merged_df.columns.duplicated()]
        
        print(f"✓ {len(merged_df)} birleştirilmiş kayıt oluşturuldu")
        return merged_df
    
    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Model eğitimi için özellikler oluşturur
        
        Args:
            df: Ham veri seti
            
        Returns:
            Özellikler eklenmiş veri seti
        """
        print("Özellikler oluşturuluyor...")
        
        if df.empty:
            return df
        
        # Zaman bazlı özellikler
        df['hour'] = df['time_tag'].dt.hour
        df['day_of_year'] = df['time_tag'].dt.dayofyear
        df['month'] = df['time_tag'].dt.month
        
        # Hareketli ortalamalar (rolling averages)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col != 'time_tag':
                df[f'{col}_rolling_3h'] = df[col].rolling(window=3, min_periods=1).mean()
                df[f'{col}_rolling_6h'] = df[col].rolling(window=6, min_periods=1).mean()
                df[f'{col}_rolling_12h'] = df[col].rolling(window=12, min_periods=1).mean()
        
        # Lag özellikleri (geçmiş değerler)
        for col in numeric_cols:
            if col != 'time_tag':
                df[f'{col}_lag_1h'] = df[col].shift(1)
                df[f'{col}_lag_3h'] = df[col].shift(3)
                df[f'{col}_lag_6h'] = df[col].shift(6)
        
        # Değişim oranları
        for col in numeric_cols:
            if col != 'time_tag':
                df[f'{col}_change_1h'] = df[col].pct_change(1)
                df[f'{col}_change_3h'] = df[col].pct_change(3)
        
        # NaN değerleri doldur
        df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        print(f"✓ {len(df.columns)} özellik oluşturuldu")
        return df
    
    def save_training_data(self, df: pd.DataFrame, filename: str = "training_data.csv"):
        """
        Eğitim verisini CSV dosyasına kaydeder
        
        Args:
            df: Kaydedilecek veri seti
            filename: Dosya adı
        """
        filepath = os.path.join(self.data_dir, filename)
        df.to_csv(filepath, index=False)
        print(f"✓ Eğitim verisi kaydedildi: {filepath}")
        print(f"  - Toplam kayıt: {len(df)}")
        print(f"  - Toplam özellik: {len(df.columns)}")
        print(f"  - Dosya boyutu: {os.path.getsize(filepath) / 1024 / 1024:.2f} MB")
    
    def fetch_and_create_dataset(self, days: int = 365, create_features: bool = True):
        """
        Tüm verileri çeker ve eğitim veri seti oluşturur
        
        Args:
            days: Çekilecek gün sayısı
            create_features: Özellik oluşturma
        """
        print("=" * 60)
        print("NOAA API'den Eğitim Veri Seti Oluşturma")
        print("=" * 60)
        print(f"Tarih aralığı: Son {days} gün")
        print()
        
        # Verileri çek
        kp_df = self.fetch_kp_index(days)
        solar_wind_df = self.fetch_solar_wind(days)
        goes_df = self.fetch_goes_xray(days)
        dst_df = self.fetch_dst_index(days)
        
        # Verileri birleştir
        merged_df = self.merge_datasets(kp_df, solar_wind_df, goes_df, dst_df)
        
        if merged_df.empty:
            print("✗ Veri seti oluşturulamadı (boş veri)")
            return
        
        # Özellikler oluştur
        if create_features:
            merged_df = self.create_features(merged_df)
        
        # Kaydet
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"training_data_{timestamp}.csv"
        self.save_training_data(merged_df, filename)
        
        print()
        print("=" * 60)
        print("✓ Eğitim veri seti başarıyla oluşturuldu!")
        print("=" * 60)


def main():
    """Ana fonksiyon"""
    fetcher = NOAATrainingDataFetcher()
    
    # Son 1 yılın verisini çek (365 gün)
    # Daha fazla veri için days parametresini artırabilirsiniz
    fetcher.fetch_and_create_dataset(days=365, create_features=True)


if __name__ == "__main__":
    main()