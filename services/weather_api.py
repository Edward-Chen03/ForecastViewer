import requests
from datetime import datetime, timedelta
from config import Config

def get_weather_params(lat, lon, forecast_days=7, timezone='auto'):
    return {
        'latitude': lat,
        'longitude': lon,
        'current': ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 
                   'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl', 
                   'surface_pressure'],
        'daily': ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 
                 'precipitation_probability_max', 'wind_speed_10m_max', 'relative_humidity_2m_mean'],
        'hourly': ['temperature_2m', 'relative_humidity_2m', 'weather_code', 
                  'wind_speed_10m', 'wind_direction_10m', 'precipitation_probability'],
        'temperature_unit': 'celsius',
        'wind_speed_unit': 'mph',
        'precipitation_unit': 'mm',
        'timezone': timezone,
        'forecast_days': forecast_days
    }

def fetch_weather_data(lat, lon, forecast_days=7, timezone='auto'):
    url = f"{Config.WEATHER_API_URL}/forecast"
    params = get_weather_params(lat, lon, forecast_days, timezone)
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Weather API returned status code {response.status_code}")

def fetch_historical_weather_data(lat, lon, start_date, end_date, timezone='auto'):
    url = Config.HISTORICAL_WEATHER_API_URL
    params = {
        'latitude': lat,
        'longitude': lon,
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'daily': ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 
                 'relative_humidity_2m_mean', 'precipitation_sum', 'wind_speed_10m_max'],
        'timezone': timezone
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Historical Weather API returned status code {response.status_code}")