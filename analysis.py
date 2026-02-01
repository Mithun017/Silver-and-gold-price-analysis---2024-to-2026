import pandas as pd
import numpy as np
import yfinance as yf
import datetime
import os
from sklearn.linear_model import LinearRegression

# We will use yfinance tickers for Gold and Silver
# Gold: GC=F (Gold Futures) or XAUUSD=X (Spot Gold)
# Silver: SI=F (Silver Futures) or XAGUSD=X (Spot Silver)
# Spot prices are generally better for this analysis.

TICKERS = {
    "XAU": "GC=F",
    "XAG": "SI=F"
}

# Check if running in a writable environment or use tmp
import tempfile

# Use temp directory for cache to support serverless (read-only FS)
CACHE_FILE = os.path.join(tempfile.gettempdir(), "historical_data.csv")

def fetch_data():
    """
    Fetches historical data using yfinance for the last 2 years.
    """
    if os.path.exists(CACHE_FILE):
        try:
            file_mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(CACHE_FILE))
            # Cache valid for 12 hours
            if datetime.datetime.now() - file_mod_time < datetime.timedelta(hours=12):
                print("Loading from cache...")
                df = pd.read_csv(CACHE_FILE)
                df['Date'] = pd.to_datetime(df['Date'])
                return df
        except Exception as e:
            print(f"Cache read error: {e}")

    print("Fetching data from yfinance...")
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=730)
    
    # Download data
    data_xau = yf.download(TICKERS["XAU"], start=start_date, end=end_date, progress=False)
    data_xag = yf.download(TICKERS["XAG"], start=start_date, end=end_date, progress=False)
    
    # Reset index to make Date a column
    data_xau = data_xau.reset_index()
    data_xag = data_xag.reset_index()
    
    # Keep only Date and Close (Price)
    # yfinance returns MultiIndex columns sometimes, need to handle that.
    # Usually: Date, Open, High, Low, Close, Adj Close, Volume
    
    # Clean up XAU
    if isinstance(data_xau.columns, pd.MultiIndex):
        # Flatten or select the specific ticker level
        # For a single ticker download, it might be straightforward: 'Close'
        # But let's be safe.
        try:
             # If columns are (Price, Ticker), we want (Close, XAUUSD=X)
             price_col = data_xau['Close'][TICKERS["XAU"]]
        except:
             price_col = data_xau['Close'] # Fallback
    else:
        price_col = data_xau['Close']
        
    df_xau = pd.DataFrame({'Date': data_xau['Date'], 'XAU': price_col})
    
    # Clean up XAG
    if isinstance(data_xag.columns, pd.MultiIndex):
        try:
             price_col = data_xag['Close'][TICKERS["XAG"]]
        except:
             price_col = data_xag['Close']
    else:
        price_col = data_xag['Close']

    df_xag = pd.DataFrame({'Date': data_xag['Date'], 'XAG': price_col})
    
    # Merge on Date
    df = pd.merge(df_xau, df_xag, on='Date', how='inner')
    
    # Ensure numeric
    df['XAU'] = pd.to_numeric(df['XAU'], errors='coerce')
    df['XAG'] = pd.to_numeric(df['XAG'], errors='coerce')
    
    df = df.dropna()
    df = df.sort_values('Date')
    
    if not df.empty:
        try:
            df.to_csv(CACHE_FILE, index=False)
        except Exception as e:
            print(f"Warning: Could not save cache to {CACHE_FILE}: {e}")
    
    return df

def process_data(df):
    """
    Calculates moving averages, returns, and ratios.
    """
    if df.empty:
        return df

    # Fill missing values if any
    df = df.ffill()
    
    # Sort
    df = df.sort_values('Date')

    # XAU Indicators
    df['XAU_MA20'] = df['XAU'].rolling(window=20).mean()
    df['XAU_MA50'] = df['XAU'].rolling(window=50).mean()
    df['XAU_MA200'] = df['XAU'].rolling(window=200).mean()
    df['XAU_Returns'] = df['XAU'].pct_change()
    
    # XAG Indicators
    df['XAG_MA20'] = df['XAG'].rolling(window=20).mean()
    df['XAG_MA50'] = df['XAG'].rolling(window=50).mean()
    df['XAG_MA200'] = df['XAG'].rolling(window=200).mean()
    
    # Gold-Silver Ratio
    df['Gold_Silver_Ratio'] = df['XAU'] / df['XAG']
    
    # Generate Signals (Educational Purpose)
    df['Signal'] = "Hold/Neutral"
    
    # Simple Logic:
    # Entry: Price closes above 50MA (Momentum)
    # Exit: Price closes below 50MA
    
    # Vectorized comparison
    df.loc[df['XAU'] > df['XAU_MA50'], 'Signal'] = "Technical Bullish Zone (Entry Watch)"
    df.loc[df['XAU'] < df['XAU_MA50'], 'Signal'] = "Technical Bearish Zone (Exit/Wait)"
    
    # Refine with Support/Resistance proximity?
    # Complex to do efficiently per row without iteration, but 50MA proxy is good for "Entry/Exit" visualization.
    
    return df

def detect_support_resistance(df):
    """
    Identifies key Support and Resistance levels based on weekly pivots.
    Returns lists of values.
    """
    if df.empty: return {"supports": [], "resistances": []}
    
    # Use weekly highs/lows to find levels
    weekly = df.set_index('Date').resample('ME').agg({'XAU': ['max', 'min']})
    weekly.columns = ['High', 'Low']
    
    # Simple logic: Top 2 highest highs (Resistance) and Bottom 2 higher lows (Support)
    # This is rudimentary.
    
    # Better approach for lines:
    # Resistance = Recent All Time High or 52-week High
    # Support = Recent Local Low (e.g. 50-day low)
    
    # XAU Levels
    recents_xau = df.tail(300)
    r_xau = recents_xau['XAU'].max()
    s_xau = recents_xau['XAU'].min()
    
    # XAG Levels
    recents_xag = df.tail(300)
    r_xag = recents_xag['XAG'].max()
    s_xag = recents_xag['XAG'].min()
    
    return {
        "xau": {
            "resistances": [r_xau],
            "supports": [s_xau]
        },
        "xag": {
            "resistances": [r_xag],
            "supports": [s_xag]
        }
    }

def analyze_market_structure(df):
    """
    Determines current trend based on MA alignment and Price action.
    """
    if df.empty: return "Unknown"
    
    latest = df.iloc[-1]
    
    trend = "Neutral"
    # Basic MA Alignment
    val_xau = latest['XAU']
    val_ma50 = latest['XAU_MA50']
    val_ma200 = latest['XAU_MA200']
    
    if pd.isna(val_ma200):
        # Not enough data for 200 MA yet?
        return "Insufficient Data"

    if val_xau > val_ma50 and val_ma50 > val_ma200:
        trend = "Bullish"
    elif val_xau < val_ma50 and val_ma50 < val_ma200:
        trend = "Bearish"
    else:
        trend = "Sideways"
        
    return trend

def detect_rallies_and_dips(df, threshold=0.05):
    """
    Detects significant market moves (Rallies and Dips).
    Returns a list of events.
    """
    if df.empty:
        return []

    events = []
    # Simplified peak/trough detection
    # We look for moves > 5% within rolling windows or swing points
    
    # Let's use a simple approach: Find local min/max over 20 day window
    # Then distinct moves between them.
    
    # Alternative: Compare price to 30-day ago price
    # If change > 5% -> potential rally/dip
    # But we want specific phases.
    
    # Let's simple check for major monthly moves for the dashboard list
    # Resample to monthly
    monthly = df.set_index('Date').resample('ME').last()
    monthly['Pct_Change'] = monthly['XAU'].pct_change()
    
    for date, row in monthly.iterrows():
        change = row['Pct_Change']
        if pd.notna(change):
            if change > 0.05:
                events.append({
                    "Type": "Rally",
                    "Date": date.strftime("%Y-%m"),
                    "Description": f"Strong monthly gain of {change*100:.1f}%",
                    "Significance": "High" if change > 0.08 else "Medium"
                })
            elif change < -0.05:
                events.append({
                    "Type": "Correction",
                    "Date": date.strftime("%Y-%m"),
                    "Description": f"Market correction of {change*100:.1f}%",
                    "Significance": "High" if change < -0.08 else "Medium"
                })
    
    return events[::-1] # Newest first

def get_prediction(df):
    """
    Simple Linear Regression forecast for next 7 days.
    """
    if df.empty or len(df) < 50:
        return {"outlook": "Insufficient Data", "forecast": []}
        
    df_reg = df.copy().dropna()
    # Prepare for regression (Linear Regression using Numpy Polyfit to save space)
    # X = days from start, y = price
    df_reg['Days'] = (df_reg['Date'] - df_reg['Date'].min()).dt.days
    
    X = df_reg['Days'].values
    y = df_reg['XAU'].values
    
    if len(X) > 1:
        # Degree 1 = Linear
        slope, intercept = np.polyfit(X, y, 1)
        
        # Predict next 7 days
        last_day = X[-1]
        future_days = np.array([last_day + i for i in range(1, 8)])
        future_prices = slope * future_days + intercept
        
        # Outlook
        outlook = "Neutral"
        if slope > 0.5: # Threshold for "significant" slope
            outlook = "Bullish Bias"
        elif slope < -0.5: # Threshold for "significant" slope
            outlook = "Bearish Bias"
            
        return {
            "slope": float(slope),
            "intercept": float(intercept),
            "outlook": outlook,
            "forecast_prices": future_prices.tolist()
        }
    else:
        return {"outlook": "Insufficient Data", "forecast_prices": []}

def get_full_analysis():
    df = fetch_data()
    df = process_data(df)
    trend = analyze_market_structure(df)
    events = detect_rallies_and_dips(df)
    sr_levels = detect_support_resistance(df)
    prediction = get_prediction(df)
    
    # Weekly aggregation
    # Resample to weekly (ending Friday)
    df_weekly = df.set_index('Date').resample('W-FRI').agg({
        'XAU': 'last', 
        'XAG': 'last',
        'Gold_Silver_Ratio': 'last'
    }).reset_index()
    
    # Convert dates to string for JSON serialization
    # We send daily data for last year (approx 250 trading days) to keep payload light
    daily_records = df.tail(300).copy()
    daily_records['Date'] = daily_records['Date'].dt.strftime('%Y-%m-%d')
    
    weekly_records = df_weekly.tail(104).copy()
    weekly_records['Date'] = weekly_records['Date'].dt.strftime('%Y-%m-%d')
    
    # Handle NaN in JSON
    daily_data = daily_records.where(pd.notnull(daily_records), None).to_dict(orient='records')
    weekly_data = weekly_records.where(pd.notnull(weekly_records), None).to_dict(orient='records')

    # Generate Momentum Text
    latest = df.iloc[-1]
    momentum_text = "Market is finding equilibrium."
    
    # Simple logic using Returns and MA
    ma_50 = latest['XAU_MA50']
    price = latest['XAU']
    
    if pd.notna(ma_50):
        dist_pct = (price - ma_50) / ma_50
        if dist_pct > 0.05:
            momentum_text = "Strong upward momentum, price significantly above 50-day average. Watch for potential overextension."
        elif dist_pct > 0.01:
            momentum_text = "Steady bullish pressure. Price is holding above key moving averages."
        elif dist_pct < -0.05:
            momentum_text = "Significant downward pressure. Price is extended to the downside."
        elif dist_pct < -0.01:
            momentum_text = "Bearish sentiment prevails, trading below the average."
        else:
            momentum_text = "Price is consolidating near the 50-day average, indicating a potential breakout or breakdown soon."

    return {
        "daily_data": daily_data,
        "weekly_data": weekly_data,
        "current_trend": trend,
        "market_events": events,
        "levels": sr_levels,
        "prediction": prediction,
        "momentum_text": momentum_text
    }

if __name__ == "__main__":
    # Test
    print("Running Analysis...")
    try:
        res = get_full_analysis()
        print(f"Trend: {res['current_trend']}")
        print(f"Daily Records: {len(res['daily_data'])}")
    except Exception as e:
        print(f"Error: {e}")
