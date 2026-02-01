# Silver & Gold Price Analysis System (2024-2026)

## 📌 Usage Guide
Double-click `run_dashboard.bat` to verify the installation, start the server, and open the dashboard automatically.

## 📖 Project Overview
This project is an end-to-end analytical system designed to analyze the market movements of **Gold (XAU)** and **Silver (XAG)** over the past two years. It provides institutional-grade insights into market trends, rallies, corrections, and future outlooks using a Python-based backend and an interactive web dashboard.

## 🚀 Key Features
- **Real-Time Data Analysis**: Fetches historical data (Futures: `GC=F`, `SI=F`) using `yfinance`.
- **Market Trend Identification**: Automatically classifies the market as **Bullish, Bearish, or Neutral** based on simple Moving Averages (20, 50, 200).
- **Rally & Dip Detection**: Identifies significant monthly market moves (>5%) to highlight accumulation and distribution phases.
- **Gold-Silver Ratio**: Monitors the relative strength between the two metals.
- **Predictive Modeling**: Uses Linear Regression to provide a probabilistic short-term outlook (7-day forecast).
- **Interactive Dashboard**: A responsive HTML/CSS/JS interface featuring dynamic charts (Chart.js) and insight cards.

## 🛠 Tech Stack
- **Backend**: Python 3.x, Flask (API Server)
- **Data Science**: Pandas, NumPy, Scikit-learn, Yfinance
- **Frontend**: HTML5, CSS3 (Dark Financial Theme), JavaScript (Vanilla), Chart.js
- **deployment**: Runnable on local Windows environment via Batch script.

## 📂 Project Structure
```
Silver and gold price analysis/
├── app.py                # Flask Server entry point
├── analysis.py           # Core data fetching and analysis logic
├── requirements.txt      # Python dependencies
├── run_dashboard.bat     # One-click launcher script
├── static/
│   ├── style.css         # Dashboard styling
│   └── script.js         # Frontend logic & Chart rendering
├── templates/
│   └── index.html        # Main dashboard UI
└── README.md             # Project documentation
```

## ⚙️ Installation & Manual Run
If you prefer not to use the `.bat` file:

1. **Prerequisites**: Ensure Python 3.10+ is installed.
2. **Setup Environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Run Application**:
   ```bash
   python app.py
   ```
4. **Access Dashboard**:
   Open `http://127.0.0.1:5000` in your browser.

## 📊 Analytical Approach
- **Momentum**: Analyzed using rate-of-change and moving average convergence/divergence.
- **Structure**: Weekly structure analysis used to confirm long-term trends (Higher Highs / Lower Lows).
- **Forecasting**: A Linear Regression model fits the recent price trend to project the likely path of least resistance for the next week. *Note: This is consistent with statistical probability, not financial advice.*

## ⚠️ Disclaimer
This tool is for educational and analytical purposes only. It does not constitute financial trading advice. Market investments carry risk.
