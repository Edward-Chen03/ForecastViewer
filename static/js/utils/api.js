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

    async addLocation(email, location) {
        try {
            const response = await fetch('/add-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    location: location
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding location:', error);
            throw error;
        }
    }

    async removeLocation(email, locationIndex) {
        try {
            const response = await fetch('/remove-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    location_index: locationIndex
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
}