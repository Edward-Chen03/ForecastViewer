class GeolocationService {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
        if (getCurrentLocationBtn) {
            getCurrentLocationBtn.addEventListener('click', () => {
                this.getCurrentLocationWeather();
            });
        }
    }

    async getCurrentLocationWeather() {
        const weatherDisplay = document.getElementById('weatherDisplay');
        
        if (!navigator.geolocation) {
            weatherDisplay.innerHTML = '<div class="error">Geolocation is not supported by this browser.</div>';
            return;
        }

        weatherDisplay.innerHTML = '<div class="loading">Getting your location...</div>';

        try {
            console.log('GeolocationService: Requesting geolocation...');
            const position = await this.getCurrentPosition();
            console.log('GeolocationService: Geolocation received:', position);
            
            const { latitude, longitude } = position.coords;
            console.log('GeolocationService: Coordinates:', latitude, longitude);

            weatherDisplay.innerHTML = '<div class="loading">Loading weather for your location...</div>';

            const result = await window.apiService.getCurrentLocationWeather(latitude, longitude);
            console.log('GeolocationService: Weather API result:', result);

            if (result.status === 'success') {
                // Override location name to show "Your Location (Approximately)"
                const locationData = {
                    ...result.data,
                    location: {
                        ...result.data.location,
                        name: "Your Location (Approximately)"
                    }
                };
                window.weatherDisplay.displayCurrentLocationWeather(locationData);
            } else {
                console.error('GeolocationService: Weather API error:', result);
                weatherDisplay.innerHTML = `<div class="error">${result.message}</div>`;
            }

        } catch (error) {
            console.error('GeolocationService: Error in getCurrentLocationWeather:', error);
            
            let errorMessage = 'Failed to get your location. ';
            
            if (error.code === 1) {
                errorMessage = 'Location access denied. Please allow location access and try again.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please check your connection and try again.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
            } else if (error.message && error.message.includes('HTTP')) {
                errorMessage = 'Weather service unavailable. Please try again later.';
            } else if (error.name === 'NotAllowedError') {
                errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Location unavailable. Please check that location services are enabled.';
            } else if (error.name === 'TimeoutError') {
                errorMessage = 'Location request timed out. Please try again.';
            } else {
                errorMessage += 'Please try again.';
            }
            
            errorMessage += '<br><small>Troubleshooting: Make sure location services are enabled and you\'re using HTTPS.</small>';
            weatherDisplay.innerHTML = `<div class="error">${errorMessage}</div>`;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 15000,  // Increased timeout to 15 seconds
                maximumAge: 300000
            };
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }
}