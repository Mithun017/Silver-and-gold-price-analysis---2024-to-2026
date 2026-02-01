let globalAnalysisData = {};

document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
    try {
        const [respData, respAnalysis] = await Promise.all([
            fetch('/api/data'),
            fetch('/api/analysis')
        ]);

        const data = await respData.json();
        const analysisData = await respAnalysis.json();
        globalAnalysisData = analysisData; // Store for chart use

        // Update UI Text elements
        if (analysisData.trend) {
            updateDashboard(analysisData);
        }

        // Render Charts using both data sources
        if (data.daily) {
            renderCharts(data.daily);
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderCharts(dailyData) {
    const dates = dailyData.map(d => d.Date.split('T')[0]);
    const goldPrices = dailyData.map(d => d.XAU);
    const goldMA50 = dailyData.map(d => d.XAU_MA50);
    const goldMA200 = dailyData.map(d => d.XAU_MA200);
    const silverPrices = dailyData.map(d => d.XAG);
    const signals = dailyData.map(d => d.Signal || "Neutral"); // Get signals

    // Update Current Prices in Cards
    const lastRec = dailyData[dailyData.length - 1];
    if (lastRec) {
        document.getElementById('gold-price').textContent = `$${parseFloat(lastRec.XAU).toFixed(2)}`;
        document.getElementById('silver-price').textContent = `$${parseFloat(lastRec.XAG).toFixed(2)}`;
        document.getElementById('gs-ratio').textContent = (lastRec.XAU / lastRec.XAG).toFixed(2);
    }

    // Extract levels from GLOBAL data
    const levels = globalAnalysisData.levels || {};
    const xauLevels = levels.xau || { supports: [], resistances: [] };
    const xagLevels = levels.xag || { supports: [], resistances: [] };

    // Helper to create annotations
    const createAnnotations = (lvlObj) => {
        const anns = [];
        (lvlObj.resistances || []).forEach(r => {
            anns.push({
                label: `Resistance`,
                data: new Array(dates.length).fill(r),
                borderColor: '#dc2626',
                borderWidth: 1.5,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            });
        });
        (lvlObj.supports || []).forEach(s => {
            anns.push({
                label: `Support`,
                data: new Array(dates.length).fill(s),
                borderColor: '#16a34a',
                borderWidth: 1.5,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            });
        });
        return anns;
    };

    const goldAnnotations = createAnnotations(xauLevels);
    const silverAnnotations = createAnnotations(xagLevels);

    // Gold Chart
    const ctxGold = document.getElementById('goldChart').getContext('2d');

    // Merge datasets
    const goldDatasets = [
        {
            label: 'Gold Price (USD)',
            data: goldPrices,
            borderColor: '#d97706', // Dark gold
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            tension: 0.2, // Smoother line
            pointRadius: 0,
            borderWidth: 2
        },
        {
            label: '50-Day MA',
            data: goldMA50,
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            pointRadius: 0
        },
        {
            label: '200-Day MA',
            data: goldMA200,
            borderColor: '#818cf8',
            borderWidth: 1.5,
            pointRadius: 0
        },
        ...goldAnnotations
    ];

    if (window.goldChartInstance) window.goldChartInstance.destroy();
    window.goldChartInstance = new Chart(ctxGold, {
        type: 'line',
        data: {
            labels: dates,
            datasets: goldDatasets
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#64748b' }
                },
                y: {
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#64748b' }
                }
            },
            plugins: {
                legend: { labels: { color: '#475569' } },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1e293b',
                    bodyColor: '#1e293b',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function (context) {
                            const index = context.dataIndex;
                            const signal = signals[index];
                            if (signal && signal !== "Hold/Neutral" && signal !== "Neutral") {
                                return `Signal: ${signal}`;
                            }
                        }
                    }
                }
            }
        }
    });

    // Silver Chart (Similar styling)
    const ctxSilver = document.getElementById('silverChart').getContext('2d');

    const silverDatasets = [
        {
            label: 'Silver Price (USD)',
            data: silverPrices,
            borderColor: '#64748b',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 2
        },
        ...silverAnnotations
    ];

    if (window.silverChartInstance) window.silverChartInstance.destroy();
    window.silverChartInstance = new Chart(ctxSilver, {
        type: 'line',
        data: {
            labels: dates,
            datasets: silverDatasets
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } }
            },
            plugins: {
                legend: { labels: { color: '#475569' } },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1e293b',
                    bodyColor: '#1e293b',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderWidth: 1
                }
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

    // Momentum Text
    const momentumEl = document.getElementById('momentum-text');
    if (analysisData.momentum_text) {
        momentumEl.textContent = analysisData.momentum_text;
    }

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
        phases[0].classList.add('active-phase'); // Accumulation
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
            // Insert before footer
            const footer = document.querySelector('footer');
            footer.parentNode.insertBefore(eventContainer, footer);
        }

        const list = document.getElementById('events-list');
        list.innerHTML = '';
        events.slice(0, 5).forEach(e => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${e.Date} (${e.Type}):</strong> ${e.Description}`;
            li.style.marginTop = '0.5rem';
            li.style.color = e.Type === 'Rally' ? '#16a34a' : '#ef4444';
            list.appendChild(li);
        });
    }
}
