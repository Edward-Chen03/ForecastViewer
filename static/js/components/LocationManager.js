class LocationManager {
    constructor() {
        this.starredLocations = [];
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
                this.confirmAddLocation();
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
        const locationPreview = document.getElementById('locationPreview');
        const confirmText = document.getElementById('locationConfirmText');
        const confirmActions = document.getElementById('confirmActions');
        
        if (modal) {
            if (locationInput) locationInput.value = '';
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
        const locationPreview = document.getElementById('locationPreview');
        const confirmText = document.getElementById('locationConfirmText');
        const confirmActions = document.getElementById('confirmActions');
        
        if (modal) {
            modal.style.display = 'none';
        }

        if (locationInput) locationInput.value = '';
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
            const result = await window.apiService.addLocation(window.authManager.getCurrentUser(), location);

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

        if (!preview || !confirmText || !confirmActions) return;

        preview.innerHTML = `
            <div class="location-preview-name">${locationData.location_name}</div>
            <div class="location-preview-details">
                Coordinates: ${locationData.lat}, ${locationData.lon}<br>
                This location will be added to your starred locations.
            </div>
        `;
        preview.style.display = 'block';

        confirmText.textContent = `Add "${locationData.location_name}" to your starred locations?`;
        confirmText.style.display = 'block';
        confirmActions.style.display = 'flex';

        this.pendingLocation = locationData;
    }

    async confirmAddLocation() {
        if (!this.pendingLocation) return;
        const locationToAdd = {
            location_name: this.pendingLocation.location_name,
            city: this.pendingLocation.city,
            region: this.pendingLocation.region,
            lat: this.pendingLocation.lat,
            lon: this.pendingLocation.lon
        };

        const confirmBtn = document.getElementById('confirmAddLocation');
        if (confirmBtn) {
            confirmBtn.textContent = 'Adding...';
            confirmBtn.disabled = true;
        }

        try {
            await this.loadUserLocations();
            const newLocationIndex = this.starredLocations.findIndex(loc => 
                loc.city === locationToAdd.city && 
                loc.region === locationToAdd.region &&
                Math.abs(loc.lat - locationToAdd.lat) < 0.001 &&
                Math.abs(loc.lon - locationToAdd.lon) < 0.001
            );
            
            console.log('Looking for newly added location:', locationToAdd);
            console.log('Found at index:', newLocationIndex);
            console.log('All starred locations:', this.starredLocations);
            
            this.hideAddLocationModal();
            
            if (newLocationIndex !== -1 && window.weatherDashboard) {
                setTimeout(() => {
                    window.weatherDashboard.switchDashboard(`location_${newLocationIndex}`);
                }, 100);
            }
            
        } catch (error) {
            console.error('Error confirming location:', error);
            this.showNotification('Error adding location. Please try again.', 'error');
        } finally {
            if (confirmBtn) {
                confirmBtn.textContent = 'Add to Starred';
                confirmBtn.disabled = false;
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

    async removeLocation(locationIndex) {
        if (!window.authManager || !window.authManager.getCurrentUser()) {
            return;
        }

        const location = this.starredLocations[locationIndex];
        if (!location) return;

        if (!await this.showConfirmation(`Remove "${location.location_name}" from your starred locations?`)) {
            return;
        }

        try {
            const result = await window.apiService.removeLocation(window.authManager.getCurrentUser(), locationIndex);

            if (result.status === 'success') {
                if (this.selectedLocationIndex === locationIndex) {
                    window.weatherDashboard.switchDashboard('current_location');
                }
                
                await this.loadUserLocations();
                this.showNotification(`Removed ${location.location_name} from starred locations`, 'success');
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
            this.starredLocations = [];
            this.displayLocations([]);
            return;
        }

        try {
            const result = await window.apiService.getUserLocations(window.authManager.getCurrentUser());

            if (result.status === 'success') {
                this.starredLocations = result.locations;
                this.displayLocations(result.locations);
                if (window.weatherDashboard) {
                    window.weatherDashboard.updateLocationSelector();
                }
                console.log('Loaded starred locations:', result.locations);
            } else {
                console.error('Failed to load user locations:', result.message);
                this.starredLocations = [];
                this.displayLocations([]);
            }
        } catch (error) {
            console.error('Error loading user locations:', error);
            this.starredLocations = [];
            this.displayLocations([]);
        }
    }

    displayLocations(locations) {
        const locationsList = document.getElementById('locationsList');
        if (!locationsList) return;
        
        if (locations.length === 0) {
            locationsList.innerHTML = '<p>No starred locations yet. Add your first location below!</p>';
        } else {
            locationsList.innerHTML = locations.map((location, index) => `
                <div class="location-item ${this.selectedLocationIndex === index ? 'selected' : ''}" data-location-index="${index}">
                    <div class="location-item-header">
                        <div class="location-item-name">${location.location_name}</div>
                        <button class="location-item-remove" onclick="window.locationManager.removeLocation(${index})">Remove</button>
                    </div>
                    <div class="location-item-details">
                        ${location.city}, ${location.region} ${location.country}
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