import zipfile

import numpy as np
import pandas as pd


# 1. Solar Data (Gunluk)
solar_dates = pd.date_range(start="2015-01-01", end="2026-03-28", freq="D")
solar_df = pd.DataFrame(
    {
        "Date": solar_dates,
        "Radio Flux 10.7cm": np.random.uniform(60, 280, size=len(solar_dates)),
        "Sunspot Number": np.random.uniform(0, 250, size=len(solar_dates)),
        "Sunspot Area (10^6 Hemis.)": np.random.uniform(0, 3000, size=len(solar_dates)),
        "New Regions": np.random.randint(0, 5, size=len(solar_dates)),
        "Stanford Mean Solar Field (GOES15)": 0,
        "Stanford Background X-Ray Flux": "A0.1",
        "Flares: C": np.random.randint(0, 15, size=len(solar_dates)),
        "Flares: M": np.random.randint(0, 5, size=len(solar_dates)),
        "Flares: X": np.random.randint(0, 2, size=len(solar_dates)),
        "Flares: S": -1,
        "Flares: 1": -1,
        "Flares: 2": -1,
        "Flares: 3": -1,
    }
)

# 2. Geomagnetic Data (3 saatlik)
geo_dates = pd.date_range(start="2015-01-01", end="2026-03-29", freq="3h")
geo_df = pd.DataFrame(
    {
        "Timestamp": geo_dates,
        "Middle Latitude A": 4,
        "High Latitude A": "*",
        "Estimated A": 2,
        "Middle Latitude K": 1,
        "High Latitude K": "*",
        "Estimated K": np.random.uniform(0, 9, size=len(geo_dates)),
    }
)

# 3. CSV + ZIP
solar_df.to_csv("daily_solar_data.csv", index=False)
geo_df.to_csv("daily_geomagnetic_data.csv", index=False)

with zipfile.ZipFile("archive.zip", "w", compression=zipfile.ZIP_DEFLATED) as z:
    z.write("daily_solar_data.csv")
    z.write("daily_geomagnetic_data.csv")

print("archive.zip olusturuldu.")
