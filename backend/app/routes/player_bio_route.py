from flask import Blueprint, jsonify, current_app
from ..models.player import Player

player_bp = Blueprint('player', __name__)

@player_bp.route('/bio')
def get_players():
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
    

@player_bp.route('/bio/<int:player_id>')
def get_player_bio(player_id):
    player = Player.query.get(player_id)
    
    if not player:
        return jsonify({
            'success': False,
            'error': 'Player not found'
        }), 404
    
    try:
        player_data = {
            'id': player.player_id,
            'firstName': player.first_name,
            'lastName': player.last_name,
            'position': player.position,
            'age': player.age,
            'height': float(player.height) if player.height else None,
            'weight': player.weight,
            'birthPlace': player.birth_place,
            'imageUrl': player.image_url
        }
        
        return jsonify({
            'success': True,
            'player': player_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error processing player {player_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error processing player data'
        }), 500