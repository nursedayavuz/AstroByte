import requests
import json

# Test forecast-series endpoint
response = requests.get('http://localhost:8000/api/forecast-series')
data = response.json()

print(f"Status: {response.status_code}")
print(f"Data length: {len(data)}")
print(f"First 3 items:")
print(json.dumps(data[:3], indent=2))

# Test space-weather-history endpoint
response2 = requests.get('http://localhost:8000/api/space-weather-history')
data2 = response2.json()

print(f"\n\nSpace Weather History:")
print(f"Status: {response2.status_code}")
print(json.dumps(data2, indent=2))