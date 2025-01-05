from flask import Blueprint, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError
from ..models.player import Player

player_bp = Blueprint('player', __name__)

@player_bp.route('/bio')
def get_players():
    try:
        players = Player.query.all()
        
        player_list = []
        for player in players:
            try:
                player_list.append({
                    'id': player.player_id,
                    'firstName': player.first_name,
                    'lastName': player.last_name,
                    'position': player.position,
                    'age': player.age,
                    'height': float(player.height) if player.height else None,
                    'weight': player.weight,
                    'birthPlace': player.birth_place,
                    'imageUrl': player.image_url
                })
            except Exception as e:
                current_app.logger.error(f"Error processing player {player.player_id}: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'players': player_list
        }), 200
        
    except SQLAlchemyError as e:
        # Handle database-specific errors
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Database error occurred'
        }), 500
        
    except Exception as e:
        # Handle any other unexpected errors
        current_app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500