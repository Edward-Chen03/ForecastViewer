class WeatherDashboard {
    constructor() {
        this.currentDashboardLocation = 'nyc';
        this.forecastData = null;
        this.currentWeather = null;
        this.location = null;
        this.selectedDayIndex = 0;
        this.userLocationData = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    initializeForUser(isLoggedIn) {
        if (this.isInitialized) return;
        
        this.isInitialized = true;
        
        if (isLoggedIn) {
            this.updateDashboardTitle('Getting your location...');
            this.loadUserLocationOnLogin();
        } else {
            this.updateDashboardTitle('New York City - 7 Day Forecast');
            this.loadNYCForecast();
        }
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshWeatherBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCurrentDashboard();
            });
        }

        const locationSelect = document.getElementById('locationSelect');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.switchDashboard(e.target.value);
            });
        }
    }

    refreshCurrentDashboard() {
        if (this.currentDashboardLocation === 'current_location') {
            this.loadCurrentLocationForecast();
        } else if (this.currentDashboardLocation === 'nyc') {
            this.loadNYCForecast();
        } else {
            this.loadLocationForecast(this.currentDashboardLocation);
        }
    }

    switchDashboard(locationValue) {
        if (locationValue === 'current_location') {
            this.currentDashboardLocation = 'current_location';
            this.loadCurrentLocationForecast();
            if (window.locationManager) {
                window.locationManager.updateLocationSelection(null);
            }
        } else if (locationValue === 'nyc') {
            this.currentDashboardLocation = 'nyc';
            this.loadNYCForecast();
            this.updateDashboardTitle('New York City - 7 Day Forecast');
            if (window.locationManager) {
                window.locationManager.updateLocationSelection(null);
            }
        } else {
            const locationIndex = parseInt(locationValue.replace('location_', ''));
            if (window.locationManager && window.locationManager.starredLocations[locationIndex]) {
                const location = window.locationManager.starredLocations[locationIndex];
                this.currentDashboardLocation = location;
                this.loadLocationForecast(location);
                if (window.locationManager) {
                    window.locationManager.updateLocationSelection(locationIndex);
                }
            }
        }
        this.selectedDayIndex = 0;
        this.updateLocationSelector();
    }

    updateDashboardTitle(title) {
        const titleElement = document.getElementById('dashboardTitle');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    async loadCurrentLocationForecast() {
        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const forecastGrid = document.getElementById('forecastGrid');

        currentWeatherCard.innerHTML = '<div class="loading">Getting your location...</div>';
        forecastGrid.innerHTML = '<div class="loading">Loading forecast...</div>';

        if (!navigator.geolocation) {
            window.weatherDisplay.displayError('Geolocation is not supported by this browser.');
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;

            currentWeatherCard.innerHTML = '<div class="loading">Loading weather for your location...</div>';

            const result = await window.apiService.getLocationForecast(latitude, longitude);

            if (result.status === 'success') {
                this.forecastData = result.data.forecast;
                this.currentWeather = result.data.current;
                this.location = result.data.location;
                this.selectedDayIndex = 0;
                this.userLocationData = {
                    lat: latitude,
                    lon: longitude
                };
                
                this.updateDashboardTitle(`${result.data.location.name}, ${result.data.location.region} - 7 Day Forecast`);
                window.weatherDisplay.displayCurrentWeather(result.data.current, result.data.location, this);
                window.weatherDisplay.displayForecast(result.data.forecast, this);
            } else {
                window.weatherDisplay.displayError(result.message);
            }

        } catch (error) {
            let errorMessage = 'Failed to get your location. ';
            
            if (error.code === 1) {
                errorMessage = 'Location access denied. Please allow location access and try again.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please check your connection and try again.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
            } else if (error.message && error.message.includes('HTTP')) {
                errorMessage = 'Weather service unavailable. Please try again later.';
            } else {
                errorMessage += 'Please try again.';
            }
            
            console.error('Error loading current location weather:', error);
            window.weatherDisplay.displayError(errorMessage);
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            };
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    async loadLocationForecast(location) {
        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const forecastGrid = document.getElementById('forecastGrid');

        currentWeatherCard.innerHTML = '<div class="loading">Loading current weather...</div>';
        forecastGrid.innerHTML = '<div class="loading">Loading 7-day forecast...</div>';

        this.updateDashboardTitle(`${location.city}, ${location.region} - 7 Day Forecast`);

        try {
            const result = await window.apiService.getLocationForecast(location.lat, location.lon);

            if (result.status === 'success') {
                this.forecastData = result.data.forecast;
                this.currentWeather = result.data.current;
                this.location = result.data.location;
                this.selectedDayIndex = 0;
                
                window.weatherDisplay.displayCurrentWeather(result.data.current, result.data.location, this);
                window.weatherDisplay.displayForecast(result.data.forecast, this);
            } else {
                window.weatherDisplay.displayError(result.message);
            }
        } catch (error) {
            console.error('Error loading location weather data:', error);
            window.weatherDisplay.displayError('Failed to load weather data. Please try again.');
        }
    }

    async loadNYCForecast() {
        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const forecastGrid = document.getElementById('forecastGrid');

        currentWeatherCard.innerHTML = '<div class="loading">Loading current weather...</div>';
        forecastGrid.innerHTML = '<div class="loading">Loading 7-day forecast...</div>';

        this.updateDashboardTitle('New York City - 7 Day Forecast');

        try {
            const result = await window.apiService.getNYCForecast();

            if (result.status === 'success') {
                this.forecastData = result.data.forecast;
                this.currentWeather = result.data.current;
                this.location = result.data.location;
                this.selectedDayIndex = 0;
                
                window.weatherDisplay.displayCurrentWeather(result.data.current, result.data.location, this);
                window.weatherDisplay.displayForecast(result.data.forecast, this);
            } else {
                window.weatherDisplay.displayError(result.message);
            }
        } catch (error) {
            console.error('Error loading weather data:', error);
            window.weatherDisplay.displayError('Failed to load weather data. Please try again.');
        }
    }

    selectDay(dayIndex) {
        this.selectedDayIndex = dayIndex;
        
        document.querySelectorAll('.forecast-day').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-day-index="${dayIndex}"]`).classList.add('selected');
        
        const hourlyContainer = document.getElementById('currentHourlyForecast');
        if (hourlyContainer) {
            hourlyContainer.style.display = 'none';
            const expandIcon = document.querySelector('.expand-icon');
            if (expandIcon) {
                expandIcon.textContent = '▼';
            }
        }
        
        if (this.forecastData && this.currentWeather && this.location) {
            window.weatherDisplay.displayCurrentWeather(this.currentWeather, this.location, this);
        }
    }

    toggleCurrentHourlyForecast() {
        const hourlyContainer = document.getElementById('currentHourlyForecast');
        const expandIcon = document.querySelector('.expand-icon');
        
        if (hourlyContainer.style.display === 'none') {
            window.weatherDisplay.displayHourlyForecast('currentHourlyScroll', this.selectedDayIndex, this.forecastData);
            hourlyContainer.style.display = 'block';
            expandIcon.textContent = '▲';
        } else {
            hourlyContainer.style.display = 'none';
            expandIcon.textContent = '▼';
        }
    }

    updateLocationSelector() {
        const locationSelect = document.getElementById('locationSelect');
        const locationSelector = document.getElementById('locationSelector');
        
        if (!locationSelect || !locationSelector) return;

        if (window.authManager && window.authManager.getCurrentUser()) {
            locationSelector.style.display = 'block';
            
            const starredLocations = window.locationManager ? window.locationManager.starredLocations : [];
            locationSelect.innerHTML = '<option value="current_location">📍 Your Location</option>' +
                starredLocations.map((location, index) => 
                    `<option value="location_${index}">${location.city}, ${location.region}</option>`
                ).join('');
                
            if (this.currentDashboardLocation === 'current_location') {
                locationSelect.value = 'current_location';
            } else if (window.locationManager && window.locationManager.selectedLocationIndex !== null) {
                locationSelect.value = `location_${window.locationManager.selectedLocationIndex}`;
            }
        } else {
            locationSelector.style.display = 'none';
        }
    }

    async loadUserLocationOnLogin() {
        this.currentDashboardLocation = 'current_location';
        await this.loadCurrentLocationForecast();
        this.updateLocationSelector();
    }
}