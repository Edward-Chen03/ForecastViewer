from datetime import datetime
from utils.conversions import celsius_to_fahrenheit
from utils.weather_codes import get_weather_description, get_weather_icon

def build_current_weather_data(current_data):
    current_temp_c = current_data['temperature_2m']
    current_temp_f = celsius_to_fahrenheit(current_temp_c)
    
    return {
        'temp_f': round(current_temp_f, 1),
        'temp_c': round(current_temp_c, 1),
        'condition': get_weather_description(current_data['weather_code']),
        'icon': get_weather_icon(current_data['weather_code'], 1),
        'humidity': current_data['relative_humidity_2m'],
        'wind_mph': round(current_data['wind_speed_10m'], 1),
        'wind_dir': 'N',
        'pressure_in': round(current_data.get('pressure_msl', 1013) * 0.02953, 2),
        'feelslike_f': round(celsius_to_fahrenheit(current_data['apparent_temperature']), 1),
        'feelslike_c': round(current_data['apparent_temperature'], 1),
        'uv': 0,
        'vis_miles': 10.0
    }

def build_hourly_weather_data(hourly_data, date_filter=None, limit=None):
    hourly_weather = []
    current_time = datetime.now()
    current_hour = current_time.hour
    
    for i, hour_time in enumerate(hourly_data['time']):
        if date_filter:
            hour_date = hour_time.split('T')[0]
            if hour_date != date_filter:
                continue
        
        if limit:
            hour_dt = datetime.fromisoformat(hour_time.replace('T', ' '))
            if hour_dt.hour < current_hour:
                continue
            if len(hourly_weather) >= limit:
                break
        
        hour_temp_c = hourly_data['temperature_2m'][i]
        hourly_item = {
            'time': hour_time,
            'temp_f': round(celsius_to_fahrenheit(hour_temp_c), 1),
            'temp_c': round(hour_temp_c, 1),
            'condition': get_weather_description(hourly_data['weather_code'][i]),
            'icon': get_weather_icon(hourly_data['weather_code'][i], 1),
            'chance_of_rain': hourly_data['precipitation_probability'][i] if hourly_data['precipitation_probability'][i] else 0,
            'wind_mph': round(hourly_data['wind_speed_10m'][i], 1),
            'wind_dir': 'N',
            'humidity': hourly_data['relative_humidity_2m'][i]
        }
        hourly_weather.append(hourly_item)
    
    return hourly_weather

def build_daily_forecast_data(daily_data, hourly_data):

    forecast = []
    
    for i in range(len(daily_data['time'])):
        date_str = daily_data['time'][i]
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        
        hourly_for_day = build_hourly_weather_data(hourly_data, date_filter=date_str)
        
        day_data = {
            'date': date_str,
            'day_name': date_obj.strftime('%A'),
            'max_temp_f': round(celsius_to_fahrenheit(daily_data['temperature_2m_max'][i]), 1),
            'max_temp_c': round(daily_data['temperature_2m_max'][i], 1),
            'min_temp_f': round(celsius_to_fahrenheit(daily_data['temperature_2m_min'][i]), 1),
            'min_temp_c': round(daily_data['temperature_2m_min'][i], 1),
            'condition': get_weather_description(daily_data['weather_code'][i]),
            'icon': get_weather_icon(daily_data['weather_code'][i], 1),
            'chance_of_rain': daily_data['precipitation_probability_max'][i] if daily_data['precipitation_probability_max'][i] else 0,
            'humidity': round(daily_data['relative_humidity_2m_mean'][i]),
            'wind_mph': round(daily_data['wind_speed_10m_max'][i], 1),
            'hourly': hourly_for_day
        }
        forecast.append(day_data)
    
    return forecast

def build_weather_response(api_data, location_info):

    current_data = build_current_weather_data(api_data['current'])
    forecast_data = build_daily_forecast_data(api_data['daily'], api_data['hourly'])
    
    return {
        'location': {
            'name': location_info['name'],
            'region': location_info['region'],
            'country': location_info['country'],
            'localtime': datetime.now().strftime('%Y-%m-%d %H:%M')
        },
        'current': current_data,
        'forecast': forecast_data
    }

def format_historical_weather_response(weather_records, location_info):

    formatted_data = []
    
    for record in weather_records:
        temp_max = record['temperature_max']
        temp_min = record['temperature_min']
        precipitation = record['precipitation']
        wind_speed = record['wind_speed']
        
        if temp_max is None or temp_min is None:
            continue
            
        day_data = {
            'date': record['weather_date'],
            'day_name': datetime.strptime(record['weather_date'], '%Y-%m-%d').strftime('%A'),
            'max_temp_f': round(celsius_to_fahrenheit(float(temp_max)), 1),
            'max_temp_c': round(float(temp_max), 1),
            'min_temp_f': round(celsius_to_fahrenheit(float(temp_min)), 1),
            'min_temp_c': round(float(temp_min), 1),
            'condition': record['weather_description'],
            'icon': get_weather_icon(int(record['weather_condition']), 1),
            'precipitation': round(float(precipitation), 2) if precipitation is not None else 0.0,
            'humidity': record['humidity'] if record['humidity'] is not None else 0,
            'wind_mph': round(float(wind_speed), 1) if wind_speed is not None else 0.0
        }
        formatted_data.append(day_data)
    
    return {
        'location': location_info,
        'historical_data': formatted_data,
        'period': {
            'start_date': weather_records[0]['weather_date'] if weather_records else None,
            'end_date': weather_records[-1]['weather_date'] if weather_records else None,
            'total_days': len(formatted_data)  
        }
    }