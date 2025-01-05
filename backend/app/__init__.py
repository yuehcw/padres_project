from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()

def create_app():
    load_dotenv()
    
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Basic configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Basic test route at root level
    # @app.route('/')
    # def home():
    #     return jsonify({
    #         'status': 'success',
    #         'message': 'Flask server is running'
    #     })
    
    # Import and register blueprints
    from .routes import init_routes
    init_routes(app)
    
    # Debug: Print all registered routes
    # print('\nRegistered Routes:')
    # for rule in app.url_map.iter_rules():
    #     print(f"{rule.methods} {rule.rule}")
    
    return app