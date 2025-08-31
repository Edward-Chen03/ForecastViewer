def get_weather_icon(weather_code, is_day=1):

    if weather_code == 0:
        return "☀️" if is_day else "🌙"
    elif weather_code == 1:
        return "🌤️" if is_day else "🌙"
    elif weather_code == 2:
        return "⛅"
    elif weather_code == 3:
        return "☁️"
    elif weather_code in [45, 48]:  
        return "🌫️"
    elif weather_code in [51, 53]:  
        return "🌦️"
    elif weather_code in [55, 61, 63]: 
        return "🌧️"
    elif weather_code in [65, 95, 96, 99]:  
        return "⛈️"
    elif weather_code in [71, 75]:  
        return "🌨️"
    elif weather_code == 73: 
        return "❄️"
    else:
        return "☀️" if is_day else "🌙"

def get_weather_description(weather_code):
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    }
    return descriptions.get(weather_code, "Unknown")