from flask import Flask, request, jsonify, render_template
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import requests
from datetime import datetime

load_dotenv()

app = Flask(__name__)

supabase: Client = create_client(
    os.getenv("FORECAST_URL"),
    os.getenv("FORECAST_KEY")
)

WEATHER_KEY = os.getenv("FORECAST_API")
WEATHER_URL = "http://api.weatherapi.com/v1"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/auth/login', methods=['POST'])
def auth_login():
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({'status': 'error', 'message': 'Email is required'})
        
        if '@' not in email or '.' not in email:
            return jsonify({'status': 'error', 'message': 'Invalid email format'})
        
        existing = supabase.table('users').select("*").eq('email', email).execute()
        
        if existing.data:
            user_data = existing.data[0]
            supabase.table('users').update({
                'last_login': 'now()'
            }).eq('email', email).execute()
            
            user_status = 'existing'
            message = f'Welcome back!'
        else:
            new_user = {
                'email': email,
                'starred': [],
                'last_login': 'now()'
            }
            
            response = supabase.table('users').insert(new_user).execute()
            user_data = response.data[0]
            user_status = 'new'
            message = f'Welcome! Your account has been created.'
        
        return jsonify({
            'status': 'success',
            'email': email,
            'user_status': user_status,
            'message': message,
            'user_data': user_data
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/weather/nyc-forecast')
def get_nyc_forecast():
    try:
        url = f"{WEATHER_URL}/forecast.json"
        params = {
            'key': WEATHER_KEY,
            'q': '40.7128,-74.0060',
            'days': 7,
            'aqi': 'no',
            'alerts': 'no'
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            forecast_data = {
                'location': {
                    'name': 'New York City',
                    'region': data['location']['region'],
                    'country': data['location']['country'],
                    'localtime': data['location']['localtime']
                },
                'current': {
                    'temp_f': data['current']['temp_f'],
                    'temp_c': data['current']['temp_c'],
                    'condition': data['current']['condition']['text'],
                    'icon': data['current']['condition']['icon'],
                    'humidity': data['current']['humidity'],
                    'wind_mph': data['current']['wind_mph'],
                    'feelslike_f': data['current']['feelslike_f'],
                    'feelslike_c': data['current']['feelslike_c']
                },
                'forecast': []
            }
            
            for day in data['forecast']['forecastday']:
                hourly_data = []
                for hour in day['hour']:
                    hourly_item = {
                        'time': hour['time'],
                        'temp_f': hour['temp_f'],
                        'temp_c': hour['temp_c'],
                        'condition': hour['condition']['text'],
                        'icon': hour['condition']['icon'],
                        'chance_of_rain': hour['chance_of_rain'],
                        'wind_mph': hour['wind_mph'],
                        'wind_dir': hour['wind_dir'],
                        'humidity': hour['humidity']
                    }
                    hourly_data.append(hourly_item)
                
                day_data = {
                    'date': day['date'],
                    'day_name': datetime.strptime(day['date'], '%Y-%m-%d').strftime('%A'),
                    'max_temp_f': day['day']['maxtemp_f'],
                    'max_temp_c': day['day']['maxtemp_c'],
                    'min_temp_f': day['day']['mintemp_f'],
                    'min_temp_c': day['day']['mintemp_c'],
                    'condition': day['day']['condition']['text'],
                    'icon': day['day']['condition']['icon'],
                    'chance_of_rain': day['day']['daily_chance_of_rain'],
                    'humidity': day['day']['avghumidity'],
                    'wind_mph': day['day']['maxwind_mph'],
                    'hourly': hourly_data
                }
                forecast_data['forecast'].append(day_data)
            
            return jsonify({
                'status': 'success',
                'data': forecast_data
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to fetch weather data'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Weather API error: {str(e)}'
        })

@app.route('/weather/current-location-hourly', methods=['POST'])
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
        
        url = f"{WEATHER_URL}/forecast.json"
        params = {
            'key': WEATHER_KEY,
            'q': f'{lat},{lon}',
            'days': 1,
            'aqi': 'no',
            'alerts': 'no'
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            api_data = response.json()
            
            current_data = {
                'temp_f': api_data['current']['temp_f'],
                'temp_c': api_data['current']['temp_c'],
                'condition': api_data['current']['condition']['text'],
                'icon': api_data['current']['condition']['icon'],
                'humidity': api_data['current']['humidity'],
                'wind_mph': api_data['current']['wind_mph'],
                'wind_dir': api_data['current']['wind_dir'],
                'pressure_in': api_data['current']['pressure_in'],
                'feelslike_f': api_data['current']['feelslike_f'],
                'feelslike_c': api_data['current']['feelslike_c'],
                'uv': api_data['current']['uv'],
                'vis_miles': api_data['current']['vis_miles']
            }
            
            hourly_data = []
            if api_data['forecast']['forecastday']:
                today_forecast = api_data['forecast']['forecastday'][0]
                current_time = datetime.now()
                current_hour = current_time.hour
                
                for hour_data in today_forecast['hour']:
                    hour_time = datetime.strptime(hour_data['time'], '%Y-%m-%d %H:%M')
                    
                    if hour_time.hour >= current_hour:
                        hourly_item = {
                            'time': hour_data['time'],
                            'temp_f': hour_data['temp_f'],
                            'temp_c': hour_data['temp_c'],
                            'condition': hour_data['condition']['text'],
                            'icon': hour_data['condition']['icon'],
                            'chance_of_rain': hour_data['chance_of_rain'],
                            'wind_mph': hour_data['wind_mph'],
                            'wind_dir': hour_data['wind_dir'],
                            'humidity': hour_data['humidity']
                        }
                        hourly_data.append(hourly_item)
                        
                        if len(hourly_data) >= 12:
                            break
            
            weather_data = {
                'location': {
                    'name': api_data['location']['name'],
                    'region': api_data['location']['region'],
                    'country': api_data['location']['country'],
                    'localtime': api_data['location']['localtime']
                },
                'current': current_data,
                'hourly': hourly_data
            }
            
            return jsonify({
                'status': 'success',
                'data': weather_data
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to fetch weather data'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Weather API error: {str(e)}'
        })

@app.route('/add-location', methods=['POST'])
def add_location():
    try:
        data = request.json
        email = data.get('email')
        location_query = data.get('location')
        
        if not email or not location_query:
            return jsonify({
                'status': 'error',
                'message': 'Email and location are required'
            })
        
        url = f"{WEATHER_URL}/current.json"
        params = {
            'key': WEATHER_KEY,
            'q': location_query,
            'aqi': 'no'
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({
                'status': 'error',
                'message': 'Location not found. Please check the spelling and try again.'
            })
        
        weather_data = response.json()
        location_info = weather_data['location']
        
        new_location = {
            'location_name': f"{location_info['name']}, {location_info['region']}, {location_info['country']}",
            'city': location_info['name'],
            'region': location_info['region'],
            'country': location_info['country'],
            'lat': location_info['lat'],
            'lon': location_info['lon'],
            'created_at': datetime.now().isoformat()
        }
        
        user_response = supabase.table('users').select("starred").eq('email', email).execute()
        
        if not user_response.data:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            })
        
        current_starred = user_response.data[0].get('starred', [])
        
        for location in current_starred:
            if (location.get('city', '').lower() == location_info['name'].lower() and 
                location.get('region', '').lower() == location_info['region'].lower()):
                return jsonify({
                    'status': 'error',
                    'message': f"{location_info['name']}, {location_info['region']} is already in your starred locations"
                })
        
        current_starred.append(new_location)
        
        update_response = supabase.table('users').update({
            'starred': current_starred
        }).eq('email', email).execute()
        
        return jsonify({
            'status': 'success',
            'message': f"Added {new_location['location_name']} to your starred locations",
            'location': new_location,
            'starred_locations': current_starred
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error adding location: {str(e)}'
        })

@app.route('/remove-location', methods=['POST'])
def remove_location():
    try:
        data = request.json
        email = data.get('email')
        location_index = data.get('location_index')
        
        if not email or location_index is None:
            return jsonify({
                'status': 'error',
                'message': 'Email and location index are required'
            })
        
        user_response = supabase.table('users').select("starred").eq('email', email).execute()
        
        if not user_response.data:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            })
        
        current_starred = user_response.data[0].get('starred', [])
        
        if location_index < 0 or location_index >= len(current_starred):
            return jsonify({
                'status': 'error',
                'message': 'Invalid location index'
            })
        
        removed_location = current_starred.pop(location_index)
        
        update_response = supabase.table('users').update({
            'starred': current_starred
        }).eq('email', email).execute()
        
        return jsonify({
            'status': 'success',
            'message': f"Removed {removed_location['location_name']} from your starred locations",
            'starred_locations': current_starred
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error removing location: {str(e)}'
        })

@app.route('/weather/location-forecast', methods=['POST'])
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
        
        url = f"{WEATHER_URL}/forecast.json"
        params = {
            'key': WEATHER_KEY,
            'q': f'{lat},{lon}',
            'days': 7,
            'aqi': 'no',
            'alerts': 'no'
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            forecast_data = {
                'location': {
                    'name': data['location']['name'],
                    'region': data['location']['region'],
                    'country': data['location']['country'],
                    'localtime': data['location']['localtime']
                },
                'current': {
                    'temp_f': data['current']['temp_f'],
                    'temp_c': data['current']['temp_c'],
                    'condition': data['current']['condition']['text'],
                    'icon': data['current']['condition']['icon'],
                    'humidity': data['current']['humidity'],
                    'wind_mph': data['current']['wind_mph'],
                    'feelslike_f': data['current']['feelslike_f'],
                    'feelslike_c': data['current']['feelslike_c']
                },
                'forecast': []
            }
            
            for day in data['forecast']['forecastday']:
                hourly_data = []
                for hour in day['hour']:
                    hourly_item = {
                        'time': hour['time'],
                        'temp_f': hour['temp_f'],
                        'temp_c': hour['temp_c'],
                        'condition': hour['condition']['text'],
                        'icon': hour['condition']['icon'],
                        'chance_of_rain': hour['chance_of_rain'],
                        'wind_mph': hour['wind_mph'],
                        'wind_dir': hour['wind_dir'],
                        'humidity': hour['humidity']
                    }
                    hourly_data.append(hourly_item)
                
                day_data = {
                    'date': day['date'],
                    'day_name': datetime.strptime(day['date'], '%Y-%m-%d').strftime('%A'),
                    'max_temp_f': day['day']['maxtemp_f'],
                    'max_temp_c': day['day']['maxtemp_c'],
                    'min_temp_f': day['day']['mintemp_f'],
                    'min_temp_c': day['day']['mintemp_c'],
                    'condition': day['day']['condition']['text'],
                    'icon': day['day']['condition']['icon'],
                    'chance_of_rain': day['day']['daily_chance_of_rain'],
                    'humidity': day['day']['avghumidity'],
                    'wind_mph': day['day']['maxwind_mph'],
                    'hourly': hourly_data
                }
                forecast_data['forecast'].append(day_data)
            
            return jsonify({
                'status': 'success',
                'data': forecast_data
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to fetch weather data'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Weather API error: {str(e)}'
        })

@app.route('/get-locations/<email>')
def get_user_locations(email):
    try:
        response = supabase.table('users').select("starred").eq('email', email).execute()
        
        if response.data:
            starred = response.data[0].get('starred', [])
            return jsonify({
                'status': 'success',
                'locations': starred
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        })

# LOCAL
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True)