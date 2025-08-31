import requests
from config import Config

def search_location(location_query):
    url = f"{Config.GEOCODING_API_URL}/search"
    params = {
        'name': location_query,
        'count': 1,
        'language': 'en',
        'format': 'json'
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception('Location search service unavailable. Please try again later.')
    
    geo_data = response.json()
    
    if not geo_data.get('results'):
        raise ValueError('Location not found. Please check the spelling and try again.')
    
    location_info = geo_data['results'][0]
    base_name = location_info['name']
    region = location_info.get('admin1', '')
    country = location_info.get('country', '')

    if region and country == 'United States':
        formatted_name = f"{base_name}, {region}"
    elif region and country:
        formatted_name = f"{base_name}, {region}, {country}"
    elif country and country != 'United States':
        formatted_name = f"{base_name}, {country}"
    else:
        formatted_name = base_name
    
    return {
        'name': formatted_name,
        'region': region,
        'country': country,
        'latitude': location_info['latitude'],
        'longitude': location_info['longitude']
    }