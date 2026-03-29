import urllib.request
import json
import os

URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
OUTPUT_FILE = r"c:\Users\Berat\Desktop\yarışma\solarguard-dashboard\src\data\globalTles.js"

print("Fetching active satellites from Celestrak...")
req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = response.read().decode('utf-8').splitlines()
    
    satellites = []
    
    # Process 3 lines at a time
    for i in range(0, len(data), 3):
        if i + 2 >= len(data): break
        name = data[i].strip()
        tle1 = data[i+1].strip()
        tle2 = data[i+2].strip()
        
        # Categorize
        category = 'OTHER'
        if 'STARLINK' in name:
            category = 'STARLINK'
        elif 'NAVSTAR' in name or 'GPS' in name:
            category = 'GPS'
        elif 'TURKSAT' in name or 'GOKTURK' in name or 'BILSAT' in name or 'IMECE' in name or 'RASAT' in name:
            category = 'TURKEY'
            
        satellites.append({
            "name": name,
            "tle1": tle1,
            "tle2": tle2,
            "category": category
        })
        
    # We don't want to crash the browser with 9000 satellites, so we sample if needed.
    # Let's limit to all Turkish, all GPS, and max 1500 Starlink, 1000 others.
    final_sats = []
    starlink_count = 0
    other_count = 0
    
    for s in satellites:
        if s["category"] == 'TURKEY':
            final_sats.append(s)
        elif s["category"] == 'GPS':
            final_sats.append(s)
        elif s["category"] == 'STARLINK':
            if starlink_count < 1000:
                final_sats.append(s)
                starlink_count += 1
        else:
            if other_count < 800:
                final_sats.append(s)
                other_count += 1
                
    js_content = f"// Auto-generated Celestrak Database\nexport const GLOBAL_TLES = {json.dumps(final_sats, indent=2)};\n"
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Successfully generated globalTles.js with {len(final_sats)} satellites.")

except Exception as e:
    print(f"Error fetching data: {e}")
