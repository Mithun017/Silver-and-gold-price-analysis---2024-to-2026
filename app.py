from flask import Flask, render_template, jsonify, request
from analysis import get_full_analysis, fetch_data
import os

app = Flask(__name__)

# Cache analysis in memory for simplicity in this demo
# In production, use proper caching
CACHE_DATA = {}
LAST_UPDATE = None

def get_data_cached():
    global CACHE_DATA, LAST_UPDATE
    import datetime
    now = datetime.datetime.now()
    # Update cache if it's empty or older than 1 hour
    if not CACHE_DATA or (LAST_UPDATE and (now - LAST_UPDATE).total_seconds() > 3600):
        try:
            CACHE_DATA = get_full_analysis()
            LAST_UPDATE = now
        except Exception as e:
            print(f"Error updating analysis: {e}")
            return None
    return CACHE_DATA

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def api_data():
    data = get_data_cached()
    if not data:
        return jsonify({"error": "Failed to load data"}), 500
    
    return jsonify({
        "daily": data['daily_data'],
        "weekly": data['weekly_data']
    })

@app.route('/api/analysis')
def api_analysis():
    data = get_data_cached()
    if not data:
        return jsonify({"error": "Failed to load data"}), 500
    
    return jsonify({
        "trend": data['current_trend'],
        "prediction": data['prediction'],
        "levels": data.get('levels', {}),
        "market_events": data.get('market_events', []),
        "momentum_text": data.get('momentum_text', "")
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
