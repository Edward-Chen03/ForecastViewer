// Add this new class to handle weather history functionality

class WeatherHistory {
    constructor() {
        this.currentMonth = new Date().getMonth() + 1;
        this.currentYear = new Date().getFullYear();
        this.isHistoryMode = false;
        this.currentLocationData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Monthly view toggle button
        const monthlyViewBtn = document.getElementById('monthlyViewBtn');
        if (monthlyViewBtn) {
            monthlyViewBtn.addEventListener('click', () => {
                this.toggleHistoryMode();
            });
        }

        // Navigation buttons
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.navigateMonth(-1);
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.navigateMonth(1);
            });
        }

        // Back to current button
        const backToCurrentBtn = document.getElementById('backToCurrentBtn');
        if (backToCurrentBtn) {
            backToCurrentBtn.addEventListener('click', () => {
                this.exitHistoryMode();
            });
        }
    }

    async toggleHistoryMode() {
        if (!window.authManager || !window.authManager.getCurrentUser()) {
            window.locationManager.showNotification('Please log in to view weather history', 'error');
            return;
        }

        // Get current selected location
        const dashboard = window.weatherDashboard;
        if (dashboard.currentDashboardLocation === 'nyc' || dashboard.currentDashboardLocation === 'current_location') {
            window.locationManager.showNotification('Weather history is only available for saved locations', 'info');
            return;
        }

        // Get current location data
        if (window.locationManager && window.locationManager.selectedLocationIndex !== null) {
            const location = window.locationManager.savedLocations[window.locationManager.selectedLocationIndex];
            if (!location) {
                window.locationManager.showNotification('Please select a saved location first', 'error');
                return;
            }

            this.currentLocationData = location;
            this.isHistoryMode = true;
            this.currentMonth = new Date().getMonth() + 1;
            this.currentYear = new Date().getFullYear();

            await this.loadMonthlyHistory();
            this.updateHistoryUI();
        } else {
            window.locationManager.showNotification('Please select a saved location first', 'error');
        }
    }

    async navigateMonth(direction) {
        if (!this.isHistoryMode) return;

        this.currentMonth += direction;
        
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear += 1;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear -= 1;
        }

        // Don't allow future dates
        const today = new Date();
        const requestedDate = new Date(this.currentYear, this.currentMonth - 1, 1);
        
        if (requestedDate > today) {
            // Revert the change
            this.currentMonth -= direction;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear += 1;
            } else if (this.currentMonth < 1) {
                this.currentMonth = 12;
                this.currentYear -= 1;
            }
            
            window.locationManager.showNotification('Cannot view future weather data', 'error');
            return;
        }

        await this.loadMonthlyHistory();
        this.updateHistoryUI();
    }

    async loadMonthlyHistory() {
        if (!this.currentLocationData) return;

        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const forecastGrid = document.getElementById('forecastGrid');
        
        currentWeatherCard.innerHTML = '<div class="loading">Loading historical weather data...</div>';
        forecastGrid.innerHTML = '<div class="loading">Loading monthly history...</div>';

        try {
            const result = await window.apiService.getWeatherHistory(
                window.authManager.getCurrentUser(),
                this.currentLocationData.id,
                this.currentYear,
                this.currentMonth
            );

            if (result.status === 'success') {
                this.displayHistoryData(result.data);
                
                // Show cache indicator
                const cacheIndicator = result.data.from_cache ? ' (from cache)' : ' (fresh data)';
                console.log(`Loaded ${result.data.period.total_days} days of data${cacheIndicator}`);
            } else {
                currentWeatherCard.innerHTML = `<div class="error">Failed to load weather history: ${result.message}</div>`;
                forecastGrid.innerHTML = '';
            }
        } catch (error) {
            console.error('Error loading weather history:', error);
            currentWeatherCard.innerHTML = '<div class="error">Failed to load weather history. Please try again.</div>';
            forecastGrid.innerHTML = '';
        }
    }

    displayHistoryData(data) {
        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const forecastGrid = document.getElementById('forecastGrid');
        
        // Display month summary
        const monthName = new Date(this.currentYear, this.currentMonth - 1, 1).toLocaleString('default', { month: 'long' });
        const totalDays = data.period.total_days;
        
        // Calculate month statistics
        const temperatures = data.historical_data.map(d => (d.max_temp_f + d.min_temp_f) / 2);
        const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
        const maxTemp = Math.max(...data.historical_data.map(d => d.max_temp_f));
        const minTemp = Math.min(...data.historical_data.map(d => d.min_temp_f));
        const totalPrecipitation = data.historical_data.reduce((sum, d) => sum + d.precipitation, 0);
        
        currentWeatherCard.innerHTML = `
            <div class="history-summary">
                <h3>${data.location.name}</h3>
                <h4>${monthName} ${this.currentYear} Summary</h4>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Average Temperature</span>
                        <span class="stat-value">${Math.round(avgTemp)}°F</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">High / Low</span>
                        <span class="stat-value">${Math.round(maxTemp)}° / ${Math.round(minTemp)}°</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Precipitation</span>
                        <span class="stat-value">${totalPrecipitation.toFixed(1)} mm</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Days of Data</span>
                        <span class="stat-value">${totalDays}</span>
                    </div>
                </div>
            </div>
        `;

        // Display daily history
        const historyHTML = data.historical_data.map(day => {
            const dayDate = new Date(day.date + 'T00:00:00');
            
            return `
                <div class="history-day">
                    <div class="history-day-name">${day.day_name}</div>
                    <div class="history-date">${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div class="history-icon">
                        <div class="weather-emoji" style="font-size: 2rem;">${day.icon}</div>
                    </div>
                    <div class="history-temps">
                        <span class="history-high">${day.max_temp_f}°</span>
                        <span class="history-low">${day.min_temp_f}°</span>
                    </div>
                    <div class="history-condition">${day.condition}</div>
                    <div class="history-details">
                        ${day.precipitation}mm rain<br>
                        Wind: ${day.wind_mph} mph<br>
                        Humidity: ${day.humidity}%
                    </div>
                </div>
            `;
        }).join('');

        forecastGrid.innerHTML = historyHTML;
    }

    updateHistoryUI() {
        const dashboardTitle = document.getElementById('dashboardTitle');
        const historyControls = document.getElementById('historyControls');
        const regularControls = document.getElementById('regularControls');
        const monthlyViewBtn = document.getElementById('monthlyViewBtn');
        
        if (this.isHistoryMode) {
            const monthName = new Date(this.currentYear, this.currentMonth - 1, 1).toLocaleString('default', { month: 'long' });
            
            if (dashboardTitle) {
                dashboardTitle.textContent = `${this.currentLocationData.name} - ${monthName} ${this.currentYear} History`;
            }
            
            if (historyControls) {
                historyControls.style.display = 'flex';
            }
            
            if (regularControls) {
                regularControls.style.display = 'none';
            }
            
            if (monthlyViewBtn) {
                monthlyViewBtn.textContent = 'Exit History';
                monthlyViewBtn.classList.add('active');
            }
        } else {
            if (historyControls) {
                historyControls.style.display = 'none';
            }
            
            if (regularControls) {
                regularControls.style.display = 'flex';
            }
            
            if (monthlyViewBtn) {
                monthlyViewBtn.textContent = 'Monthly History';
                monthlyViewBtn.classList.remove('active');
            }
        }
    }

    exitHistoryMode() {
        this.isHistoryMode = false;
        this.currentLocationData = null;
        
        // Return to current forecast
        if (window.weatherDashboard) {
            window.weatherDashboard.refreshCurrentDashboard();
        }
        
        this.updateHistoryUI();
    }
}

// Initialize the weather history manager
document.addEventListener('DOMContentLoaded', function() {
    // Add this to your existing main.js initialization
    window.weatherHistory = new WeatherHistory();
});