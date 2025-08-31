import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL = "https://vfvylrqakajqrxgwbthl.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdnlscnFha2FqcXJ4Z3didGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDQ5MzIsImV4cCI6MjA3MDc4MDkzMn0.UFk4hHnUwy4Gp3HKzGYlPHpVq1ZYI8LLigVZ9hwHfJg"

    WEATHER_API_URL = "https://api.open-meteo.com/v1"
    GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1"
    HISTORICAL_WEATHER_API_URL = "https://archive-api.open-meteo.com/v1/archive"
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('FLASK_HOST', 'localhost')
    PORT = int(os.getenv('FLASK_PORT', 5000))