from datetime import datetime, timedelta
from supabase import create_client, Client
from config import Config
from utils.weather_codes import get_weather_description

supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def store_weather_history(location_id, weather_data):

    daily_data = weather_data['daily']
    stored_records = []
    
    for i, date_str in enumerate(daily_data['time']):
        temp_max = daily_data['temperature_2m_max'][i]
        temp_min = daily_data['temperature_2m_min'][i]
        humidity = daily_data['relative_humidity_2m_mean'][i]
        precipitation = daily_data['precipitation_sum'][i]
        wind_speed = daily_data['wind_speed_10m_max'][i]
        weather_code = daily_data['weather_code'][i]
        
        if temp_max is None or temp_min is None or weather_code is None:
            print(f"Skipping {date_str} - missing essential weather data")
            continue
        
        weather_record = {
            'location_id': location_id,
            'weather_date': date_str,
            'temperature_max': float(temp_max),
            'temperature_min': float(temp_min),
            'humidity': int(humidity) if humidity is not None else None,
            'precipitation': float(precipitation) if precipitation is not None else 0.0,
            'wind_speed': float(wind_speed) if wind_speed is not None else 0.0,
            'weather_condition': str(int(weather_code)),
            'weather_description': get_weather_description(int(weather_code))
        }
        
        try:
            result = supabase.table('location_history').upsert(weather_record, on_conflict='location_id,weather_date').execute()
            stored_records.append(result.data[0])
        except Exception as e:
            print(f"Error storing weather record for {date_str}: {e}")
            continue
    
    return stored_records

def get_weather_history_from_db(location_id, start_date, end_date):
    try:
        result = (supabase.table('location_history')
                 .select("*")
                 .eq('location_id', location_id)
                 .gte('weather_date', start_date.strftime('%Y-%m-%d'))
                 .lte('weather_date', end_date.strftime('%Y-%m-%d'))
                 .order('weather_date')
                 .limit(50)
                 .execute())
        
        return result.data
    except Exception as e:
        print(f"Error retrieving weather history: {e}")
        return []

def check_weather_history_completeness(location_id, start_date, end_date):
    existing_records = get_weather_history_from_db(location_id, start_date, end_date)
    
    expected_days = (end_date - start_date).days + 1

    if len(existing_records) < expected_days:
        return False, existing_records
    
    existing_dates = {record['weather_date'] for record in existing_records}
    current_date = start_date
    
    while current_date <= end_date:
        if current_date.strftime('%Y-%m-%d') not in existing_dates:
            return False, existing_records
        current_date += timedelta(days=1)
    
    return True, existing_records