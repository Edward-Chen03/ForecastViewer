class LocationManager {
    constructor() {
        this.savedLocations = [];
        this.selectedLocationIndex = null;
        this.pendingLocation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const showAddLocationBtn = document.getElementById('showAddLocationBtn');
        if (showAddLocationBtn) {
            showAddLocationBtn.addEventListener('click', () => {
                this.showAddLocationModal();
            });
        }

        const searchLocationBtn = document.getElementById('searchLocationBtn');
        if (searchLocationBtn) {
            searchLocationBtn.addEventListener('click', () => {
                this.searchLocation();
            });
        }

        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchLocation();
                }
            });
        }

        this.setupModalHandlers();
    }

    setupModalHandlers() {
        const closeModal = document.getElementById('closeAddLocationModal');
        const cancelAdd = document.getElementById('cancelAddLocation');
        const confirmAdd = document.getElementById('confirmAddLocation');
        const modal = document.getElementById('addLocationModal');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideAddLocationModal();
            });
        }

        if (cancelAdd) {
            cancelAdd.addEventListener('click', () => {
                this.hideAddLocationModal();
            });
        }

        if (confirmAdd) {
            confirmAdd.addEventListener('click', () => {
                this.confirmSaveLocation();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'addLocationModal') {
                    this.hideAddLocationModal();
                }
            });
        }
    }

    showAddLocationModal() {
        const modal = document.getElementById('addLocationModal');
        const locationInput = document.getElementById('locationInput');
        const customNameInput = document.getElementById('customNameInput');
        const locationPreview = document.getElementById('locationPreview');
        const confirmText = document.getElementById('locationConfirmText');
        const confirmActions = document.getElementById('confirmActions');

        if (modal) {
            if (locationInput) locationInput.value = '';
            if (customNameInput) customNameInput.value = '';
            if (locationPreview) locationPreview.style.display = 'none';
            if (confirmText) confirmText.style.display = 'none';
            if (confirmActions) confirmActions.style.display = 'none';
            modal.style.display = 'flex';
            if (locationInput) locationInput.focus();
        }
    }

    hideAddLocationModal() {
        const modal = document.getElementById('addLocationModal');
        const locationInput = document.getElementById('locationInput');
        const customNameInput = document.getElementById('customNameInput');
        const locationPreview = document.getElementById('locationPreview');
        const confirmText = document.getElementById('locationConfirmText');
        const confirmActions = document.getElementById('confirmActions');

        if (modal) {
            modal.style.display = 'none';
        }

        if (locationInput) locationInput.value = '';
        if (customNameInput) customNameInput.value = '';
        if (locationPreview) locationPreview.style.display = 'none';
        if (confirmText) confirmText.style.display = 'none';
        if (confirmActions) confirmActions.style.display = 'none';

        this.pendingLocation = null;
    }

    async searchLocation() {
        const locationInput = document.getElementById('locationInput');
        if (!locationInput) return;

        const location = locationInput.value.trim();

        if (!location) {
            this.showNotification('Please enter a location', 'error');
            return;
        }

        if (!window.authManager || !window.authManager.getCurrentUser()) {
            this.showNotification('Please log in to add locations', 'error');
            return;
        }

        const searchBtn = document.getElementById('searchLocationBtn');
        const originalText = searchBtn ? searchBtn.textContent : 'Search';
        if (searchBtn) {
            searchBtn.textContent = 'Searching...';
            searchBtn.disabled = true;
        }

        try {
            const result = await window.apiService.searchLocation(location);

            if (result.status === 'success') {
                this.showLocationPreview(result.location);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            this.showNotification('Error searching location. Please try again.', 'error');
        } finally {
            if (searchBtn) {
                searchBtn.textContent = originalText;
                searchBtn.disabled = false;
            }
        }
    }

    showLocationPreview(locationData) {
        const preview = document.getElementById('locationPreview');
        const confirmText = document.getElementById('locationConfirmText');
        const confirmActions = document.getElementById('confirmActions');
        const customNameSection = document.getElementById('customNameSection');

        if (!preview || !confirmText || !confirmActions) return;

        preview.innerHTML = `
            <div class="location-preview-name">${locationData.name}</div>
            <div class="location-preview-details">
                ${locationData.country}<br>
                Coordinates: ${locationData.latitude}, ${locationData.longitude}<br>
                This location will be saved to your locations.
            </div>
        `;
        preview.style.display = 'block';

        if (customNameSection) {
            customNameSection.style.display = 'block';
        }

        confirmText.textContent = `Save "${locationData.name}" to your locations?`;
        confirmText.style.display = 'block';
        confirmActions.style.display = 'flex';

        this.pendingLocation = locationData;
    }

    async confirmSaveLocation() {
        if (!this.pendingLocation) return;

        const confirmBtn = document.getElementById('confirmAddLocation');
        const customNameInput = document.getElementById('customNameInput');
        const customName = customNameInput ? customNameInput.value.trim() : null;

        if (confirmBtn) {
            confirmBtn.textContent = 'Saving...';
            confirmBtn.disabled = true;
        }

        try {
            console.log('Attempting to save location:', this.pendingLocation);

            const result = await window.apiService.saveLocation(
                window.authManager.getCurrentUser(),
                this.pendingLocation,
                customName
            );

            console.log('Save location API response:', result);

            if (result && result.status === 'success') {
                this.showNotification(result.message, 'success');
                this.hideAddLocationModal();

                // Store the pending location data for comparison
                const savedLocationData = this.pendingLocation;
                console.log('Stored location data for comparison:', savedLocationData);

                // Reload user locations and wait for completion
                await this.loadUserLocations();

                // Wait a bit more to ensure the data is fully loaded
                await new Promise(resolve => setTimeout(resolve, 100));

                // Add safety check and filter out null/undefined locations
                const validLocations = this.savedLocations.filter(loc => loc && loc.name && loc.latitude && loc.longitude);

                // Find the newly added location and switch to it - with retry logic
                let newLocationIndex = -1;
                let attempts = 0;
                const maxAttempts = 3;

                while (newLocationIndex === -1 && attempts < maxAttempts) {
                    newLocationIndex = validLocations.findIndex(loc => {
                        // Additional null check
                        if (!loc || !loc.latitude || !loc.longitude) {
                            return false;
                        }
                        
                        try {
                            const latMatch = Math.abs(parseFloat(loc.latitude) - parseFloat(savedLocationData.latitude)) < 0.001;
                            const lonMatch = Math.abs(parseFloat(loc.longitude) - parseFloat(savedLocationData.longitude)) < 0.001;

                            console.log('Comparing location:', {
                                dbLocation: loc,
                                searchLocation: savedLocationData,
                                latMatch,
                                lonMatch
                            });

                            return latMatch && lonMatch;
                        } catch (error) {
                            console.error('Error comparing locations:', error, loc);
                            return false;
                        }
                    });

                    if (newLocationIndex === -1) {
                        attempts++;
                        console.log(`Location not found, attempt ${attempts}/${maxAttempts}`);
                        
                        if (attempts < maxAttempts) {
                            // Reload locations and try again
                            await this.loadUserLocations();
                            await new Promise(resolve => setTimeout(resolve, 200));
                            // Update validLocations for next attempt
                            validLocations.length = 0;
                            validLocations.push(...this.savedLocations.filter(loc => loc && loc.name && loc.latitude && loc.longitude));
                        }
                    }
                }

                console.log('Found new location at index:', newLocationIndex);

                // Find the actual index in the full savedLocations array
                if (newLocationIndex !== -1 && window.weatherDashboard) {
                    const actualLocation = validLocations[newLocationIndex];
                    const actualIndex = this.savedLocations.findIndex(loc =>
                        loc && loc.id === actualLocation.id
                    );

                    if (actualIndex !== -1) {
                        setTimeout(() => {
                            window.weatherDashboard.switchDashboard(`location_${actualIndex}`);
                        }, 300);
                    }
                } else {
                    console.warn('Could not find newly saved location in the list');
                }
            } else {
                console.error('Save location failed:', result);
                const errorMessage = result && result.message ? result.message : 'Unknown error occurred while saving location';
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error saving location (caught exception):', error);
            let errorMessage = 'Error saving location. Please try again.';

            // Try to extract a more specific error message
            if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            this.showNotification(errorMessage, 'error');
        } finally {
            if (confirmBtn) {
                confirmBtn.textContent = 'Save Location';
                confirmBtn.disabled = false;
            }
        }
    }

    async removeLocation(locationIndex) {
        if (!window.authManager || !window.authManager.getCurrentUser()) {
            return;
        }

        const location = this.savedLocations[locationIndex];
        if (!location) return;

        if (!await this.showConfirmation(`Remove "${location.name}" from your saved locations?`)) {
            return;
        }

        try {
            const result = await window.apiService.removeLocation(
                window.authManager.getCurrentUser(),
                location.id  // This is now the user_location_id
            );

            if (result.status === 'success') {
                if (this.selectedLocationIndex === locationIndex) {
                    window.weatherDashboard.switchDashboard('current_location');
                }

                await this.loadUserLocations();
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Error removing location:', error);
            this.showNotification('Error removing location. Please try again.', 'error');
        }
    }

    async loadUserLocations() {
        if (!window.authManager || !window.authManager.getCurrentUser()) {
            this.savedLocations = [];
            this.displayLocations([]);
            return;
        }

        try {
            const result = await window.apiService.getUserLocations(window.authManager.getCurrentUser());

            if (result.status === 'success') {
                this.savedLocations = result.locations;
                this.displayLocations(result.locations);
                if (window.weatherDashboard) {
                    window.weatherDashboard.updateLocationSelector();
                }
                console.log('Loaded saved locations:', result.locations);
            } else {
                console.error('Failed to load user locations:', result.message);
                this.savedLocations = [];
                this.displayLocations([]);
            }
        } catch (error) {
            console.error('Error loading user locations:', error);
            this.savedLocations = [];
            this.displayLocations([]);
        }
    }

    displayLocations(locations) {
        const locationsList = document.getElementById('locationsList');
        if (!locationsList) return;

        if (locations.length === 0) {
            locationsList.innerHTML = '<p>No saved locations yet. Add your first location below!</p>';
        } else {
            locationsList.innerHTML = locations.map((location, index) => `
                <div class="location-item ${this.selectedLocationIndex === index ? 'selected' : ''}" data-location-index="${index}">
                    <div class="location-item-header">
                        <div class="location-item-name">${location.name}</div>
                        <button class="location-item-remove" onclick="window.locationManager.removeLocation(${index})">Remove</button>
                    </div>
                    <div class="location-item-details">
                        Coordinates: ${location.latitude}, ${location.longitude}
                    </div>
                    <div class="location-item-added">
                        Added: ${new Date(location.created_at).toLocaleDateString()}
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.location-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('location-item-remove')) return;

                    const locationIndex = parseInt(item.dataset.locationIndex);
                    window.weatherDashboard.switchDashboard(`location_${locationIndex}`);
                });
            });
        }
    }

    updateLocationSelection(locationIndex) {
        this.selectedLocationIndex = locationIndex;

        document.querySelectorAll('.location-item').forEach(item => {
            item.classList.remove('selected');
        });

        if (locationIndex !== null) {
            const selectedItem = document.querySelector(`[data-location-index="${locationIndex}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        }
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => this.hideNotification(notification), 4000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });
    }

    hideNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    showConfirmation(message) {
        return new Promise((resolve) => {
            const existingConfirm = document.querySelector('.custom-confirmation');
            if (existingConfirm) {
                existingConfirm.remove();
            }

            const confirmation = document.createElement('div');
            confirmation.className = 'custom-confirmation';
            confirmation.innerHTML = `
                <div class="confirmation-backdrop"></div>
                <div class="confirmation-dialog">
                    <div class="confirmation-content">
                        <h3>Confirm Action</h3>
                        <p>${message}</p>
                        <div class="confirmation-actions">
                            <button class="btn btn-primary confirm-yes">Yes</button>
                            <button class="btn btn-secondary confirm-no">No</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmation);
            setTimeout(() => confirmation.classList.add('show'), 10);

            confirmation.querySelector('.confirm-yes').addEventListener('click', () => {
                this.hideConfirmation(confirmation);
                resolve(true);
            });

            confirmation.querySelector('.confirm-no').addEventListener('click', () => {
                this.hideConfirmation(confirmation);
                resolve(false);
            });

            confirmation.querySelector('.confirmation-backdrop').addEventListener('click', () => {
                this.hideConfirmation(confirmation);
                resolve(false);
            });
        });
    }

    hideConfirmation(confirmation) {
        confirmation.classList.add('hide');
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 300);
    }
}