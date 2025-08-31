from flask import Blueprint, request, jsonify
from utils.user import get_user_id_by_email
from utils.location import (
    get_user_locations, find_or_create_location, 
    save_user_location, remove_user_location
)
from services.geocoding import search_location

locationFunctions = Blueprint('location', __name__)

@locationFunctions.route('/get-locations/<email>')
def get_user_locations_route(email):
    try:
        user_id = get_user_id_by_email(email)
        locations = get_user_locations(user_id)
        
        return jsonify({
            'status': 'success',
            'locations': locations
        })
        
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@locationFunctions.route('/search-location', methods=['POST'])
def search_location_route():
    try:
        data = request.json
        location_query = data.get('location')
        
        if not location_query:
            return jsonify({
                'status': 'error',
                'message': 'Location is required'
            })

        location_data = search_location(location_query)
        
        return jsonify({
            'status': 'success',
            'location': location_data
        })
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error searching location: {str(e)}'
        })

@locationFunctions.route('/save-location', methods=['POST'])
def save_location_route():
    try:
        data = request.json
        email = data.get('email')
        location_data = data.get('location')
        custom_name = data.get('custom_name')  
        
        if not email or not location_data:
            return jsonify({
                'status': 'error',
                'message': 'Email and location data are required'
            })
        
        user_id = get_user_id_by_email(email)
        
        location_id = find_or_create_location(
            location_data['name'],
            location_data['latitude'],
            location_data['longitude']
        )
        
        saved_location, message = save_user_location(user_id, location_id, custom_name)
        
        if saved_location is None:
            return jsonify({
                'status': 'error',
                'message': f"{location_data['name']} is already in your saved locations"
            })
        
        return jsonify({
            'status': 'success',
            'message': f"Added {location_data['name']} to your saved locations",
            'location': saved_location
        })
        
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)})
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error saving location: {str(e)}'
        })

@locationFunctions.route('/remove-location', methods=['POST'])
def remove_location_route():
    try:
        data = request.json
        email = data.get('email')
        user_location_id = data.get('location_id')  # This is now user_location_id
        
        if not email or not user_location_id:
            return jsonify({
                'status': 'error',
                'message': 'Email and location ID are required'
            })
        
        user_id = get_user_id_by_email(email)
        
        location_name, message = remove_user_location(user_id, user_location_id)
        
        if location_name is None:
            return jsonify({
                'status': 'error',
                'message': message
            })
        
        return jsonify({
            'status': 'success',
            'message': message
        })
        
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)})
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error removing location: {str(e)}'
        })