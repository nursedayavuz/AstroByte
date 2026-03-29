import argparse
import os
import zipfile

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from lstm_model import build_solar_lstm, get_training_callbacks


def load_and_preprocess_data(zip_path=None):
    print("Veriler yukleniyor ve temizleniyor...")

    if zip_path is None:
        # archive.zip dosyasini proje kokunde (astrobyte) ara
        current_dir = os.path.dirname(os.path.abspath(__file__))  # models klasoru
        project_root = os.path.dirname(os.path.dirname(current_dir))  # astrobyte klasoru
        zip_path = os.path.join(project_root, "archive.zip")
    else:
        zip_path = os.path.abspath(zip_path)

    print(f"Aranan dosya yolu: {zip_path}")
    if not os.path.exists(zip_path):
        raise FileNotFoundError(f"Kritik Hata: {zip_path} adresinde archive.zip bulunamadi!")

    with zipfile.ZipFile(zip_path, "r") as z:
        required_files = {"daily_solar_data.csv", "daily_geomagnetic_data.csv"}
        zip_files = set(z.namelist())
        missing_files = sorted(required_files - zip_files)
        if missing_files:
            raise FileNotFoundError(
                f"Kritik Hata: archive.zip icinde eksik dosyalar var: {', '.join(missing_files)}"
            )

        with z.open("daily_solar_data.csv") as f:
            solar_df = pd.read_csv(f)
        with z.open("daily_geomagnetic_data.csv") as f:
            geo_df = pd.read_csv(f)

    # 2. Tarih formatlarini duzenle
    solar_df["Date"] = pd.to_datetime(solar_df["Date"])
    geo_df["Timestamp"] = pd.to_datetime(geo_df["Timestamp"])

    # 3. Verileri birlestir
    merged_df = pd.merge_asof(
        geo_df.sort_values("Timestamp"),
        solar_df.sort_values("Date"),
        left_on="Timestamp",
        right_on="Date",
    )

    # 4. Gecersiz karakterleri temizle (*)
    merged_df = merged_df.replace("*", np.nan)
    cols_to_fix = ["Radio Flux 10.7cm", "Sunspot Number", "Estimated K"]
    for col in cols_to_fix:
        merged_df[col] = pd.to_numeric(merged_df[col], errors="coerce")

    merged_df = merged_df.ffill().fillna(0)

    # 5. Ozellik secimi
    feature_cols = [
        "Radio Flux 10.7cm",
        "Sunspot Number",
        "Estimated K",
        "Flares: C",
        "Flares: M",
        "Flares: X",
    ]

    n_features = 80
    data_features = merged_df[feature_cols].values
    padding = np.zeros((data_features.shape[0], n_features - len(feature_cols)))
    final_features = np.hstack((data_features, padding))

    # 6. Olceklendirme
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(final_features)

    # 7. Sequence (72h) ve target olusturma
    X, y_kp24, y_kp48, y_kp72 = [], [], [], []
    look_back = 72  # 3 saatlik veride 9 gun

    for i in range(len(scaled_data) - look_back - 24):
        X.append(scaled_data[i : i + look_back])
        y_kp24.append(merged_df["Estimated K"].iloc[i + look_back : i + look_back + 8].max())
        y_kp48.append(merged_df["Estimated K"].iloc[i + look_back : i + look_back + 16].max())
        y_kp72.append(merged_df["Estimated K"].iloc[i + look_back : i + look_back + 24].max())

    X = np.array(X)

    y_dict = {
        "kp_forecast_24h": np.array(y_kp24),
        "kp_forecast_48h": np.array(y_kp48),
        "kp_forecast_72h": np.array(y_kp72),
        "prob_mx_24h": (np.array(y_kp24) >= 5).astype(float),
        "prob_mx_48h": (np.array(y_kp48) >= 5).astype(float),
        "prob_mx_72h": (np.array(y_kp72) >= 5).astype(float),
    }

    return X, y_dict, n_features


def parse_args():
    parser = argparse.ArgumentParser(description="SolarGuard LSTM egitim scripti")
    parser.add_argument("--epochs", type=int, default=50, help="Egitim epoch sayisi")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size")
    parser.add_argument(
        "--zip-path",
        type=str,
        default=None,
        help="archive.zip tam yolu (verilmezse proje kokunde archive.zip aranir)",
    )
    parser.add_argument(
        "--validation-split",
        type=float,
        default=0.2,
        help="Validation orani (0-1)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if not (0 < args.validation_split < 1):
        raise ValueError("validation_split 0 ile 1 arasinda olmalidir.")

    X, y_dict, n_features = load_and_preprocess_data(zip_path=args.zip_path)

    if len(X) < 10:
        raise ValueError(
            f"Egitim icin yeterli sequence yok: {len(X)}. Veri setini ve look_back degerini kontrol et."
        )

    # Train/Val Split
    split = int((1 - args.validation_split) * len(X))
    split = max(1, min(split, len(X) - 1))

    X_train, X_val = X[:split], X[split:]
    y_train = {k: v[:split] for k, v in y_dict.items()}
    y_val = {k: v[split:] for k, v in y_dict.items()}

    print(
        f"Hazir: {len(X_train)} egitim ornegi, {len(X_val)} validation ornegi, {n_features} ozellik."
    )

    model = build_solar_lstm(look_back=72, n_features=n_features)

    print("Egitim basliyor...")
    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=get_training_callbacks(),
    )

    print("\nEgitim tamamlandi. 'best_lstm.keras' dosyasi kaydedildi.")
