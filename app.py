from flask import Flask, request, jsonify, render_template
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import requests
import uuid
from datetime import datetime, timedelta, date
import calendar

from config import Config
from routes.auth import authFunctions
from routes.weather import weatherFunctions
from routes.location import locationFunctions
    
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    app.register_blueprint(authFunctions)
    app.register_blueprint(weatherFunctions)
    app.register_blueprint(locationFunctions)
    
    @app.route('/')
    def home():
        return render_template('index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=Config.HOST, 
        port=Config.PORT, 
        ssl_context='adhoc', 
        debug=Config.DEBUG
    )