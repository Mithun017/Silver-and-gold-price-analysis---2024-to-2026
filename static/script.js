document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    fetchAnalysis();
});

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();

        if (data.daily) {
            renderCharts(data.daily);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchAnalysis() {
    try {
        const response = await fetch('/api/analysis');
        const data = await response.json();

        if (data.trend) {
            updateDashboard(data);
        }
    } catch (error) {
        console.error('Error fetching analysis:', error);
    }
}

function renderCharts(dailyData) {
    const dates = dailyData.map(d => d.Date.split('T')[0]);
    const goldPrices = dailyData.map(d => d.XAU);
    const goldMA50 = dailyData.map(d => d.XAU_MA50);
    const goldMA200 = dailyData.map(d => d.XAU_MA200);
    const silverPrices = dailyData.map(d => d.XAG);

    // Filter nulls or handle them? Chart.js handles nulls by breaking the line, which is fine.

    // Update Current Prices in Cards
    const lastRec = dailyData[dailyData.length - 1];
    if (lastRec) {
        document.getElementById('gold-price').textContent = `$${parseFloat(lastRec.XAU).toFixed(2)}`;
        document.getElementById('silver-price').textContent = `$${parseFloat(lastRec.XAG).toFixed(2)}`;
        document.getElementById('gs-ratio').textContent = (lastRec.XAU / lastRec.XAG).toFixed(2);
    }

    // Gold Chart
    const ctxGold = document.getElementById('goldChart').getContext('2d');
    new Chart(ctxGold, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Gold Price (USD)',
                    data: goldPrices,
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: '50-Day MA',
                    data: goldMA50,
                    borderColor: '#38bdf8',
                    borderWidth: 1,
                    pointRadius: 0
                },
                {
                    label: '200-Day MA',
                    data: goldMA200,
                    borderColor: '#f472b6',
                    borderWidth: 1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });

    // Silver Chart
    const ctxSilver = document.getElementById('silverChart').getContext('2d');
    new Chart(ctxSilver, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Silver Price (USD)',
                data: silverPrices,
                borderColor: '#cbd5e1',
                backgroundColor: 'rgba(203, 213, 225, 0.1)',
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });
}

function updateDashboard(analysisData) {
    // Trend
    const trendEl = document.getElementById('trend-indicator');
    trendEl.textContent = analysisData.trend;
    trendEl.className = 'indicator ' + (
        analysisData.trend.includes('Bullish') ? 'bullish' :
            analysisData.trend.includes('Bearish') ? 'bearish' : 'neutral'
    );

    // Prediction
    const predEl = document.getElementById('prediction-text');
    const predData = analysisData.prediction;

    let outlookText = `Outlook: ${predData.outlook}. `;
    if (predData.slope > 0) {
        outlookText += "Upward slope detected in recent price action.";
    } else {
        outlookText += "Downward pressure observed.";
    }
    predEl.textContent = outlookText;

    // Highlights phases (basic logic for demo)
    const phases = document.querySelectorAll('.phase-indicator span');
    phases.forEach(p => p.classList.remove('active-phase'));

    if (analysisData.trend === 'Bullish') {
        phases[1].classList.add('active-phase'); // Expansion
    } else if (analysisData.trend === 'Bearish') {
        phases[3].classList.add('active-phase'); // Correction
    } else {
        phases[0].classList.add('active-phase'); // Accumulation (or Distribution, ambiguous)
    }

    const forecastVals = document.getElementById('forecast-values');
    if (predData.forecast_prices.length > 0) {
        forecastVals.innerHTML = `<p>Next target zone: $${parseFloat(predData.forecast_prices[predData.forecast_prices.length - 1]).toFixed(0)}</p>`;
    }

    // Render Events (Rallies/Dips) if any
    const events = analysisData.market_events;
    if (events && events.length > 0) {
        // Find or create container
        let eventContainer = document.querySelector('.events-section');
        if (!eventContainer) {
            eventContainer = document.createElement('div');
            eventContainer.className = 'analysis-block events-section';
            eventContainer.innerHTML = '<h2>Recent Market Events</h2><ul id="events-list"></ul>';
            document.querySelector('.analysis-section').appendChild(eventContainer);
        }

        const list = document.getElementById('events-list');
        list.innerHTML = '';
        events.slice(0, 5).forEach(e => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${e.Date} (${e.Type}):</strong> ${e.Description}`;
            li.style.marginTop = '0.5rem';
            li.style.color = e.Type === 'Rally' ? '#22c55e' : '#ef4444';
            list.appendChild(li);
        });
    }
}
