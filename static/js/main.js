document.addEventListener('DOMContentLoaded', function() {
    window.apiService = new APIService();
    window.weatherDisplay = new WeatherDisplay();
    window.locationManager = new LocationManager();
    window.weatherDashboard = new WeatherDashboard();
    
    console.log('All components init');
    setTimeout(() => {
        console.log('Initializing AuthManager with components ready');
        window.authManager = new AuthManager();
        
        // Initialize weather history manager
        window.weatherHistory = new WeatherHistory();
    }, 100);

    initializeLegacyForms();
});

function initializeLegacyForms() {
    const form = document.getElementById('dataForm');
    const loadDataBtn = document.getElementById('loadData');
    const dataDisplay = document.getElementById('dataDisplay');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            fetch('/submit-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                alert('Data submitted successfully!');
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error submitting data');
            });
        });
    }

    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', function() {
            fetch('/test-db')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        dataDisplay.innerHTML = '<pre>' + JSON.stringify(data.data, null, 2) + '</pre>';
                    } else {
                        dataDisplay.innerHTML = '<p class="error">Error: ' + data.message + '</p>';
                    }
                })
                .catch(error => {
                    dataDisplay.innerHTML = '<p class="error">Error loading data</p>';
                });
        });
    }
}