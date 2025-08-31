def celsius_to_fahrenheit(celsius):
    return (celsius * 9/5) + 32

def format_coordinates_location(lat, lon, default_prefix="Current Location"):
    return {
        'name': f"{default_prefix} ({lat:.2f}, {lon:.2f})",
        'region': 'Unknown',
        'country': 'Unknown'
    }