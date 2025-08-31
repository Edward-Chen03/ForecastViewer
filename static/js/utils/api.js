class APIService {

    async getNYCForecast() {
        try {
            const response = await fetch('/weather/nyc-forecast');
            return await response.json();
        } catch (error) {
            console.error('Error fetching NYC forecast:', error);
            throw error;
        }
    }

    async getLocationForecast(latitude, longitude) {
        try {
            const response = await fetch('/weather/location-forecast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching location forecast:', error);
            throw error;
        }
    }

    async getCurrentLocationWeather(latitude, longitude) {
        try {
            const response = await fetch('/weather/current-location-hourly', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: latitude,
                    longitude: longitude
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching current location weather:', error);
            throw error;
        }
    }

    async searchLocation(locationQuery) {
        try {
            const response = await fetch('/search-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: locationQuery
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error searching location:', error);
            throw error;
        }
    }

    async saveLocation(email, locationData, customName = null) {
        try {
            const requestBody = {
                email: email,
                location: locationData
            };
            
            // Add custom name if provided
            if (customName && customName.trim()) {
                requestBody.custom_name = customName.trim();
            }

            const response = await fetch('/save-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving location:', error);
            throw error;
        }
    }

    async removeLocation(email, userLocationId) {
        try {
            const response = await fetch('/remove-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    location_id: userLocationId  // This is now user_location_id
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error removing location:', error);
            throw error;
        }
    }

    async getUserLocations(email) {
        try {
            const response = await fetch(`/get-locations/${email}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user locations:', error);
            throw error;
        }
    }

    async login(email) {
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    }

    async getWeatherHistory(email, userLocationId, year, month) {
        try {
            const response = await fetch('/weather/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    user_location_id: userLocationId,
                    year: year,
                    month: month
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching weather history:', error);
            throw error;
        }
    }
}