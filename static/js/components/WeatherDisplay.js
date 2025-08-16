class WeatherDisplay {
    displayCurrentWeather(current, location, dashboard) {
        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const lastUpdated = new Date(location.localtime).toLocaleString();
        const selectedDay = dashboard.forecastData ? dashboard.forecastData[dashboard.selectedDayIndex] : null;
        const isToday = dashboard.selectedDayIndex === 0;
        
        let displayData, displayLocation;
        if (isToday && dashboard.currentWeather) {
            displayData = {
                temp_f: dashboard.currentWeather.temp_f,
                condition: dashboard.currentWeather.condition,
                icon: dashboard.currentWeather.icon,
                feelslike_f: dashboard.currentWeather.feelslike_f,
                humidity: dashboard.currentWeather.humidity,
                wind_mph: dashboard.currentWeather.wind_mph
            };
            displayLocation = `${location.name}, ${location.region}`;
        } else if (selectedDay) {
            displayData = {
                temp_f: (selectedDay.max_temp_f + selectedDay.min_temp_f) / 2,
                condition: selectedDay.condition,
                icon: selectedDay.icon,
                feelslike_f: selectedDay.max_temp_f,
                humidity: selectedDay.humidity,
                wind_mph: selectedDay.wind_mph
            };
            const dayName = selectedDay.day_name;
            displayLocation = `${location.name}, ${location.region} - ${dayName}`;
        } else {
            displayData = {
                temp_f: current ? current.temp_f : 0,
                condition: current ? current.condition : 'Unknown',
                icon: current ? current.icon : '',
                feelslike_f: current ? current.feelslike_f : 0,
                humidity: current ? current.humidity : 0,
                wind_mph: current ? current.wind_mph : 0
            };
            displayLocation = `${location.name}, ${location.region}`;
        }
        
        currentWeatherCard.innerHTML = `
            <div class="current-weather-content expandable-weather" id="expandableWeatherCard">
                <div class="current-main">
                    <div class="current-temp">${Math.round(displayData.temp_f)}°</div>
                    <div class="current-info">
                        <h3>${displayLocation}</h3>
                        <div class="current-condition">${displayData.condition}</div>
                        <div class="current-details">
                            <span>Feels like ${Math.round(displayData.feelslike_f)}°</span>
                            <span>Humidity ${displayData.humidity}%</span>
                            <span>Wind ${Math.round(displayData.wind_mph)} mph</span>
                        </div>
                    </div>
                </div>
                <div class="current-icon">
                    <img src="https:${displayData.icon}" alt="${displayData.condition}">
                    <div style="font-size: 0.8rem; margin-top: 5px; opacity: 0.8;">
                        ${isToday ? `Updated: ${lastUpdated}` : 'Click to view hourly'}
                    </div>
                </div>
                <div class="expand-indicator">
                    <span class="expand-icon">▼</span>
                </div>
            </div>
            <div id="currentHourlyForecast" class="hourly-forecast-container" style="display: none;">
                <div class="hourly-forecast-scroll" id="currentHourlyScroll">
                </div>
            </div>
        `;

        const expandableCard = document.getElementById('expandableWeatherCard');
        if (expandableCard) {
            expandableCard.style.cursor = 'pointer';
            expandableCard.addEventListener('click', () => {
                dashboard.toggleCurrentHourlyForecast();
            });
        }
    }

    displayForecast(forecast, dashboard) {
        const forecastGrid = document.getElementById('forecastGrid');
        const today = new Date();
        const todayString = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');

        const forecastHTML = forecast.map((day, index) => {
            const dayDate = new Date(day.date + 'T00:00:00');
            const isToday = day.date === todayString;
            const isSelected = index === dashboard.selectedDayIndex;
            
            let displayDay;
            if (isToday) {
                displayDay = 'Today';
            } else if (index === 1 && !isToday) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowString = tomorrow.getFullYear() + '-' + 
                                     String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                                     String(tomorrow.getDate()).padStart(2, '0');
                displayDay = day.date === tomorrowString ? 'Tomorrow' : day.day_name;
            } else {
                displayDay = day.day_name;
            }

            return `
                <div class="forecast-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-day-index="${index}">
                    <div class="forecast-day-name">${displayDay}</div>
                    <div class="forecast-date">${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div class="forecast-icon">
                        <img src="https:${day.icon}" alt="${day.condition}">
                    </div>
                    <div class="forecast-temps">
                        <span class="forecast-high">${Math.round(day.max_temp_f)}°</span>
                        <span class="forecast-low">${Math.round(day.min_temp_f)}°</span>
                    </div>
                    <div class="forecast-condition">${day.condition}</div>
                    <div class="forecast-details">
                        ${day.chance_of_rain}% rain<br>
                        Wind: ${Math.round(day.wind_mph)} mph<br>
                        Humidity: ${day.humidity}%
                    </div>
                </div>
            `;
        }).join('');

        forecastGrid.innerHTML = forecastHTML;

        const dayCards = document.querySelectorAll('.forecast-day');
        dayCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const dayIndex = parseInt(card.dataset.dayIndex);
                dashboard.selectDay(dayIndex);
            });
        });
    }

    displayHourlyForecast(containerId, dayIndex, forecastData) {
        const container = document.querySelector(`#${containerId}`);
        if (!container || !forecastData || !forecastData[dayIndex]) {
            return;
        }

        const hourlyData = forecastData[dayIndex].hourly;
        const now = new Date();
        const isToday = dayIndex === 0;

        let filteredHourlyData = hourlyData;
        if (isToday) {
            const currentHour = now.getHours();
            filteredHourlyData = hourlyData.filter(hour => {
                const hourTime = new Date(hour.time);
                return hourTime.getHours() >= currentHour;
            });
        }

        const hourlyHTML = filteredHourlyData.map((hour, index) => {
            const hourTime = new Date(hour.time);
            const hourNumber = hourTime.getHours();
            const isCurrentHour = isToday && hourNumber === now.getHours() && index === 0;
            
            const timeDisplay = hourTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                hour12: true 
            });

            return `
                <div class="hourly-item ${isCurrentHour ? 'current-hour' : ''}">
                    <div class="hourly-time">${isCurrentHour ? 'Now' : timeDisplay}</div>
                    <div class="hourly-icon">
                        <img src="https:${hour.icon}" alt="${hour.condition}" />
                    </div>
                    <div class="hourly-temp">${Math.round(hour.temp_f)}°</div>
                    <div class="hourly-condition">${hour.condition}</div>
                    <div class="hourly-details">
                        <div class="hourly-rain">${hour.chance_of_rain}%</div>
                        <div class="hourly-wind">${Math.round(hour.wind_mph)} mph</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = hourlyHTML;
    }

    displayCurrentLocationWeather(data) {
        const weatherDisplay = document.getElementById('weatherDisplay');
        const { location, current, hourly } = data;
        const lastUpdated = new Date(location.localtime).toLocaleString();

        weatherDisplay.innerHTML = `
            <div class="current-location-weather">
                <div class="weather-header">
                    <h3> ${location.name}, ${location.region}</h3>
                    <small>Your Current Location</small>
                </div>
                
                <div class="weather-main">
                    <div class="weather-temp-section">
                        <div class="large-temp">${Math.round(current.temp_f)}°F</div>
                        <div class="weather-condition">
                            <img src="https:${current.icon}" alt="${current.condition}" style="width: 50px; height: 50px;">
                            <span>${current.condition}</span>
                        </div>
                    </div>
                </div>

                <div class="weather-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Feels Like</span>
                        <span class="detail-value">${Math.round(current.feelslike_f)}°F</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Humidity</span>
                        <span class="detail-value">${current.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Wind</span>
                        <span class="detail-value">${Math.round(current.wind_mph)} mph ${current.wind_dir}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Pressure</span>
                        <span class="detail-value">${current.pressure_in} in</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">UV Index</span>
                        <span class="detail-value">${current.uv}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Visibility</span>
                        <span class="detail-value">${current.vis_miles} mi</span>
                    </div>
                </div>

                <div class="hourly-forecast-section">
                    <h4>Today's Hourly Forecast</h4>
                    <div class="hourly-forecast-scroll">
                        ${this.generateHourlyForecast(hourly)}
                    </div>
                </div>

                <div class="weather-footer">
                    <small>Last updated: ${lastUpdated}</small>
                </div>
            </div>
        `;
    }

    generateHourlyForecast(hourly) {
        if (!hourly || hourly.length === 0) {
            return '<p>Hourly forecast not available</p>';
        }

        const now = new Date();
        const currentHour = now.getHours();

        return hourly.map((hour, index) => {
            const hourTime = new Date(hour.time);
            const hourNumber = hourTime.getHours();
            const isCurrentHour = hourNumber === currentHour && index === 0;
            
            const timeDisplay = hourTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                hour12: true 
            });

            return `
                <div class="hourly-item ${isCurrentHour ? 'current-hour' : ''}">
                    <div class="hourly-time">${isCurrentHour ? 'Now' : timeDisplay}</div>
                    <div class="hourly-icon">
                        <img src="https:${hour.icon}" alt="${hour.condition}" />
                    </div>
                    <div class="hourly-temp">${Math.round(hour.temp_f)}°</div>
                    <div class="hourly-condition">${hour.condition}</div>
                    <div class="hourly-details">
                        <div class="hourly-rain">${hour.chance_of_rain}%</div>
                        <div class="hourly-wind">${Math.round(hour.wind_mph)} mph</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayError(message) {
        const currentWeatherCard = document.getElementById('currentWeatherCard');
        const forecastGrid = document.getElementById('forecastGrid');

        const errorHTML = `<div class="error">⚠️ ${message}</div>`;
        
        currentWeatherCard.innerHTML = errorHTML;
        forecastGrid.innerHTML = errorHTML;
    }
}