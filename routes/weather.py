import calendar
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from utils.user import get_user_id_by_email
from utils.location import get_user_location_with_details
from utils.weather_history import (
    check_weather_history_completeness, 
    store_weather_history, 
    get_weather_history_from_db
)
from services.weather_api import fetch_weather_data, fetch_historical_weather_data
from services.weather_format import (
    build_weather_response, 
    build_current_weather_data,
    build_hourly_weather_data,
    format_historical_weather_response
)
from utils.conversions import format_coordinates_location

weatherFunctions = Blueprint('weather', __name__, url_prefix='/weather')

@weatherFunctions.route('/nyc-forecast')
def get_nyc_forecast():
    try:
        lat, lon = 40.7128, -74.0060
        api_data = fetch_weather_data(lat, lon, forecast_days=7, timezone='America/New_York')
        
        location_info = {
            'name': 'New York City',
            'region': 'New York',
            'country': 'United States'
        }
        
        weather_response = build_weather_response(api_data, location_info)
        
        return jsonify({
            'status': 'success',
            'data': weather_response
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Weather service error: {str(e)}'
        })

@weatherFunctions.route('/current-location-hourly', methods=['POST'])
def get_current_location_weather_hourly():
    try:
        data = request.json
        lat = data.get('latitude')
        lon = data.get('longitude')
        
        if not lat or not lon:
            return jsonify({
                'status': 'error',
                'message': 'Latitude and longitude are required'
            })
        
        api_data = fetch_weather_data(lat, lon, forecast_days=1, timezone='auto')
        location_info = format_coordinates_location(lat, lon, "Current Location")
        
        current_data = build_current_weather_data(api_data['current'])
        hourly_data = build_hourly_weather_data(api_data['hourly'], limit=12)
        
        weather_response = {
            'location': {
                'name': location_info['name'],
                'region': location_info['region'],
                'country': location_info['country'],
                'localtime': datetime.now().strftime('%Y-%m-%d %H:%M')
            },
            'current': current_data,
            'hourly': hourly_data
        }
        
        return jsonify({
            'status': 'success',
            'data': weather_response
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Weather service error: {str(e)}'
        })

@weatherFunctions.route('/location-forecast', methods=['POST'])
def get_location_forecast():
    try:
        data = request.json
        lat = data.get('latitude')
        lon = data.get('longitude')
        
        if not lat or not lon:
            return jsonify({
                'status': 'error',
                'message': 'Latitude and longitude are required'
            })
        
        api_data = fetch_weather_data(lat, lon, forecast_days=7, timezone='auto')
        location_info = format_coordinates_location(lat, lon, "Current Location")
        
        weather_response = build_weather_response(api_data, location_info)
        
        return jsonify({
            'status': 'success',
            'data': weather_response
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Weather API error: {str(e)}'
        })

@weatherFunctions.route('/history', methods=['POST'])
def get_weather_history():
    try:
        data = request.json
        email = data.get('email')
        user_location_id = data.get('user_location_id')
        year = data.get('year')
        month = data.get('month')
        
        if not all([email, user_location_id, year, month]):
            return jsonify({
                'status': 'error',
                'message': 'Email, user_location_id, year, and month are required'
            })
        
        user_id = get_user_id_by_email(email)
        user_location = get_user_location_with_details(user_id, user_location_id)
        
        if not user_location:
            return jsonify({
                'status': 'error',
                'message': 'Location not found or access denied'
            })
        
        location_data = user_location['locations']
        location_id = location_data['id']

        start_date = date(int(year), int(month), 1)
        last_day = calendar.monthrange(int(year), int(month))[1]
        end_date = date(int(year), int(month), last_day)

        today = date.today()
        if end_date > today:
            end_date = today
        
        if start_date > today:
            return jsonify({
                'status': 'error',
                'message': 'Cannot retrieve history for future dates'
            })
        
        is_complete, existing_records = check_weather_history_completeness(location_id, start_date, end_date)
        
        if is_complete:
            print(f"Using cached weather history for {location_data['name']} ({year}-{month:02d})")
            location_info = {
                'name': user_location['custom_name'] or location_data['name'],
                'region': '',
                'country': '',
                'latitude': location_data['latitude'],
                'longitude': location_data['longitude']
            }
            
            response_data = format_historical_weather_response(existing_records, location_info)
            response_data['from_cache'] = True
            
            return jsonify({
                'status': 'success',
                'data': response_data
            })
        
        else:
            print(f"Fetching weather history from API for {location_data['name']} ({year}-{month:02d})")
            
            try:
                api_data = fetch_historical_weather_data(
                    float(location_data['latitude']),
                    float(location_data['longitude']),
                    start_date,
                    end_date,
                    'auto'
                )
                
                stored_records = store_weather_history(location_id, api_data)
                print(f"Stored {len(stored_records)} weather records")
                
                fresh_records = get_weather_history_from_db(location_id, start_date, end_date)
                
                location_info = {
                    'name': user_location['custom_name'] or location_data['name'],
                    'region': '',
                    'country': '',
                    'latitude': location_data['latitude'],
                    'longitude': location_data['longitude']
                }
                
                response_data = format_historical_weather_response(fresh_records, location_info)
                response_data['from_cache'] = False
                
                return jsonify({
                    'status': 'success',
                    'data': response_data
                })
                
            except Exception as api_error:
                return jsonify({
                    'status': 'error',
                    'message': f'Failed to fetch historical weather data: {str(api_error)}'
                })
        
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)})
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error retrieving weather history: {str(e)}'
        })