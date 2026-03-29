import os
import zipfile

import numpy as np
import pandas as pd


def download_noaa_archive():
    print("NOAA benzeri arsiv verileri olusturuluyor...")

    current_dir = os.path.dirname(os.path.abspath(__file__))  # solarguard-tr
    project_root = os.path.dirname(current_dir)  # astrobyte

    solar_csv_path = os.path.join(project_root, "daily_solar_data.csv")
    geo_csv_path = os.path.join(project_root, "daily_geomagnetic_data.csv")
    zip_path = os.path.join(project_root, "archive.zip")

    dates_3h = pd.date_range(start="2020-01-01", end="2026-03-28", freq="3h")
    dates_daily = pd.date_range(start="2020-01-01", end="2026-03-28", freq="D")

    solar_data = pd.DataFrame(
        {
            "Date": dates_daily,
            "Radio Flux 10.7cm": np.random.uniform(70, 250, size=len(dates_daily)),
            "Sunspot Number": np.random.uniform(0, 200, size=len(dates_daily)),
            "Flares: C": np.random.randint(0, 10, size=len(dates_daily)),
            "Flares: M": np.random.randint(0, 5, size=len(dates_daily)),
            "Flares: X": np.random.randint(0, 2, size=len(dates_daily)),
        }
    )

    geo_data = pd.DataFrame(
        {
            "Timestamp": dates_3h,
            "Estimated K": np.random.uniform(0, 9, size=len(dates_3h)),
        }
    )

    solar_data.to_csv(solar_csv_path, index=False)
    geo_data.to_csv(geo_csv_path, index=False)

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(solar_csv_path, arcname="daily_solar_data.csv")
        z.write(geo_csv_path, arcname="daily_geomagnetic_data.csv")

    print(f"Olusturuldu: {zip_path}")


if __name__ == "__main__":
    download_noaa_archive()
