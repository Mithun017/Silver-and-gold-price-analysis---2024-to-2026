# 🌟 Gold & Silver Price Analysis System (2024-2026)

A professional-grade, full-stack analytical dashboard for tracking, analyzing, and forecasting Gold (XAU) and Silver (XAG) market movements. Built with Python (Flask) and a modern "Glass UI" frontend.

![Dashboard Preview](https://github.com/Mithun017/Silver-and-gold-price-analysis---2024-to-2026/assets/preview.png)

## 🚀 Key Features

### 📊 Market Analysis
- **Trend Identification**: Automatically classifies market state as **Bullish, Bearish, or Neutral** using Moving Averages (20, 50, 200).
- **Support & Resistance**: Algorithms dynamically identify and plot key S/R levels for both Gold and Silver.
- **Rally & Correction Detection**: Detects significant monthly moves (>5%) to highlight historical volatility.
- **Momentum Analysis**: Real-time momentum scoring based on price vs. 50-Day MA distance.

### 🔮 Probabilistic Forecasting
- **Short-Term Outlook**: Uses a Linear Regression model (optimized with `numpy.polyfit`) to project the "path of least resistance" for the next 7 days.
- **Sentiment Scoring**: Translates slope data into human-readable sentiment (e.g., "Bullish Bias", "Downward Pressure").
- **Disclaimer**: *All forecasts are for educational purposes only and do NOT constitute financial advice.*

### 🎨 Modern UI/UX
- **Glassmorphism Design**: sleek, translucent cards with backdrop blurs.
- **Mobile Responsive**: Fully optimized for Desktops, Tablets, and Mobile devices.
- **Interactive Charts**: Powered by `Chart.js`, featuring:
  - Price Lines
  - SMA 50 & 200 Indicators
  - **Dashed Support/Resistance Lines**

---

## 🛠️ Technical Architecture

- **Backend**: Python 3.x, Flask
- **Data Source**: `yfinance` (Yahoo Finance API) - Fetches XAU (Gold) and XAG (Silver) data.
- **Analysis Engine**: `pandas`, `numpy` (Vectorized calculations for speed).
- **Frontend**: HTML5, CSS3 (Variables, Flexbox/Grid), JavaScript (ES6+).
- **Deployment**: Vercel-ready (Serverless configuration).

## 📂 Project Structure

```
silver-gold-analysis/
├── app.py                # Main Flask Application
├── analysis.py           # Core Analysis Logic (Data Fetching, S/R, ML)
├── requirements.txt      # Project Dependencies
├── vercel.json           # Vercel Deployment Config
├── run_dashboard.bat     # Windows Launcher Script
├── static/
│   ├── style.css         # Glass UI Styling
│   └── script.js         # Frontend Logic & Chart Rendering
├── templates/
│   └── index.html        # Main Dashboard Page
└── README.md             # Documentation
```

---

## 🚀 How to Run Locally

### Option A: One-Click (Windows)
Double-click the `run_dashboard.bat` file. It will automatically:
1. Activate the virtual environment.
2. Start the Flask server.
3. Open the dashboard in your default browser.

### Option B: Manual Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mithun017/Silver-and-gold-price-analysis---2024-to-2026.git
   cd Silver-and-gold-price-analysis---2024-to-2026
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server**:
   ```bash
   python app.py
   ```

4. **Access Dashboard**:
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## ☁️ Deployment (Vercel)

This project is configured for **Vercel** deployment (Serverless Python).

1. Fork/Clone this repo to your GitHub.
2. Log in to [Vercel](https://vercel.com).
3. Click **"Add New Project"** and select this repository.
4. Vercel will auto-detect the configuration.
5. Click **Deploy**.

*Note: The app uses `/tmp` for caching data in serverless environments to ensure performance without persistent storage issues.*

---

## 📡 API Endpoints

- **`GET /api/data`**: Returns processed Daily and Weekly price data.
- **`GET /api/analysis`**: Returns:
  - Current Trend (Bullish/Bearish)
  - Momentum Analysis Text
  - Prediction Outlook (7-day slope)
  - Support & Resistance Levels (`xau` and `xag`)
  - Detected Market Events (Rallies/Dips)

---

## ⚠️ Disclaimer
This tool provides technical analysis based on historical data. It is **NOT** financial advice. Trading commodities involves significant risk.

---

**Author**: Mithun
**Version**: 2.0 (2026)
