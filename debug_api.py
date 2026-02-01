import requests
import datetime

API_KEY = "dc9dc3cedf29082cee3a1175a1a22c4a"
BASE_URL = "https://api.metalpriceapi.com/v1"

start_date = (datetime.date.today() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
end_date = datetime.date.today().strftime("%Y-%m-%d")

url = f"{BASE_URL}/timeframe"
params = {
    "api_key": API_KEY,
    "start_date": start_date,
    "end_date": end_date,
    "base": "USD",
    "currencies": "XAU,XAG"
}

print(f"Requesting: {url} with params {params}")
try:
    r = requests.get(url, params=params)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
