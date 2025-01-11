from flask import Blueprint, jsonify, request
from ..controllers.batting_controller import BattingController

batting_bp = Blueprint("batting", __name__)

@batting_bp.route("/stats")
def get_batting_stats():
    """Get basic batting statistics for a player"""
    player_id = request.args.get("player_id")
    
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400
        
    try:
        player_id = int(player_id)
    except ValueError:
        return jsonify({"error": "Invalid player ID format"}), 400

    stats = BattingController.calculate_batting_stats(player_id)
    if not stats:
        return jsonify({"error": "No batting data found for this player"}), 404

    return jsonify(stats), 200

@batting_bp.route("/spray-chart")
def get_spray_chart():
    """Get spray chart data for a player"""
    player_id = request.args.get("player_id")
    
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400
        
    try:
        player_id = int(player_id)
    except ValueError:
        return jsonify({"error": "Invalid player ID format"}), 400

    spray_data = BattingController.get_spray_chart_data(player_id)

    return jsonify(spray_data if spray_data else []), 200

@batting_bp.route("/zone-heatmap")
def get_zone_heatmap():
    """Get zone heatmap data for a player"""
    player_id = request.args.get("player_id")
    
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400
        
    try:
        player_id = int(player_id)
    except ValueError:
        return jsonify({"error": "Invalid player ID format"}), 400

    heatmap_data = BattingController.get_zone_heatmap(player_id)
    
    if heatmap_data is None:
        return jsonify({"error": "Error processing zone heatmap data"}), 500
        
    if not heatmap_data:
        return jsonify({"error": "No zone heatmap data found for this player"}), 404

    return jsonify(heatmap_data), 200
        


@batting_bp.route("/pitch-trends")
def get_pitch_trends():
    """Get pitch type trends data for a player"""
    player_id = request.args.get("player_id")
    
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400
        
    try:
        player_id = int(player_id)
    except ValueError:
        return jsonify({"error": "Invalid player ID format"}), 400

    trends_data = BattingController.get_pitch_trends(player_id)
    
    if trends_data is None:
        return jsonify({"error": "Error processing pitch trends data"}), 500
        
    if not trends_data:
        return jsonify({"error": "No pitch trends data found for this player"}), 404

    return jsonify(trends_data), 200

@batting_bp.route("/leaderboard")
def get_leaderboard():
    """Get batting leaderboard statistics"""
    leaderboard = BattingController.get_batting_leaderboard()
    
    if not leaderboard:
        return jsonify({"error": "Unable to generate leaderboard"}), 500

    return jsonify({
        "success": True,
        "data": leaderboard
    }), 200