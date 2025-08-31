class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Note: Removed localStorage usage - users will need to log in each session
        setTimeout(() => {
            if (window.weatherDashboard) {
                window.weatherDashboard.initializeForUser(false);
            }
        }, 50);
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }

        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const cancelLogin = document.getElementById('cancelLogin');
        if (cancelLogin) {
            cancelLogin.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }

        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }

        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target.id === 'loginModal') {
                    this.hideLoginModal();
                }
            });
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        const loginEmail = document.getElementById('loginEmail');

        if (loginModal) {
            loginModal.style.display = 'flex';
        }
        if (loginEmail) {
            loginEmail.focus();
        }
    }

    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        const loginForm = document.getElementById('loginForm');

        if (loginModal) {
            loginModal.style.display = 'none';
        }
        if (loginForm) {
            loginForm.reset();
        }
    }

    async handleLogin() {
        const emailInput = document.getElementById('loginEmail');
        if (!emailInput) return;

        const email = emailInput.value.trim();

        if (!email) {
            alert('Please enter a valid email address');
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            alert('Please enter a valid email address');
            return;
        }

        try {
            const result = await window.apiService.login(email);
            console.log('Login response:', result);

            if (result.status === 'success') {
                this.setCurrentUser(email, result.user_id);
                this.hideLoginModal();
                await this.loadUserData();
                console.log('Login successful:', result.message);
            } else {
                alert('Login failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your connection and try again.');
        }
    }

    setCurrentUser(email, userId) {
        this.currentUser = email;
        this.userId = userId;
        this.updateUI();
        console.log('User set:', email, 'ID:', userId);
    }

    logout() {
        console.log('Logging out user:', this.currentUser);
        this.currentUser = null;
        this.userId = null;

        // Reset weather history mode before resetting other components
        if (window.weatherHistory && window.weatherHistory.isHistoryMode) {
            window.weatherHistory.exitHistoryMode();
        }

        if (window.weatherDashboard) {
            window.weatherDashboard.currentDashboardLocation = 'nyc';
            window.weatherDashboard.isInitialized = false;
            window.weatherDashboard.initializeForUser(false);
        }

        if (window.locationManager) {
            window.locationManager.selectedLocationIndex = null;
            window.locationManager.savedLocations = [];
            window.locationManager.displayLocations([]);
        }

        this.updateUI();
        console.log('Logout complete');
    }

    updateUI() {
        const loginSection = document.getElementById('loginSection');
        const userSection = document.getElementById('userSection');
        const guestContent = document.getElementById('guestContent');
        const userContent = document.getElementById('userContent');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const userEmailSpan = document.getElementById('userEmail');
        const nycWeatherDashboard = document.querySelector('.nyc-weather-dashboard');

        console.log('Updating UI, current user:', this.currentUser);

        if (this.currentUser) {
            if (loginSection) loginSection.style.display = 'none';
            if (userSection) userSection.style.display = 'flex';
            if (guestContent) guestContent.style.display = 'none';
            if (userContent) userContent.style.display = 'block';
            if (nycWeatherDashboard) nycWeatherDashboard.style.display = 'block';

            if (userEmailSpan) userEmailSpan.textContent = this.currentUser;
            if (welcomeMessage) welcomeMessage.textContent = `Welcome back, ${this.currentUser}!`;

            if (window.weatherDashboard) {
                window.weatherDashboard.updateLocationSelector();
            }
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (guestContent) guestContent.style.display = 'block';
            if (userContent) userContent.style.display = 'none';
            if (nycWeatherDashboard) nycWeatherDashboard.style.display = 'block';

            if (welcomeMessage) welcomeMessage.textContent = 'Get weather data and save your favorite locations!';

            if (window.weatherDashboard) {
                window.weatherDashboard.updateLocationSelector();
            }
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            if (window.locationManager) {
                await window.locationManager.loadUserLocations();
            }

            if (window.weatherDashboard) {
                await window.weatherDashboard.loadUserLocationOnLogin();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            if (window.locationManager) {
                window.locationManager.displayLocations([]);
            }
            if (window.weatherDashboard) {
                window.weatherDashboard.updateLocationSelector();
            }
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserId() {
        return this.userId;
    }
}