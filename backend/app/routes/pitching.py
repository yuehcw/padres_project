from flask import Blueprint, jsonify, request
from ..controllers.pitching_controller import PitchingController

pitching_bp = Blueprint("pitching", __name__)

@pitching_bp.route("/info")
def get_pitching_data():
    player_id = request.args.get("player_id")
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400

    pitch_data = PitchingController.get_pitch_movement_data(player_id)
    if not pitch_data:
        return jsonify({"error": "No pitching data found for this player"}), 404

    stats = PitchingController.calculate_pitching_stats(player_id)
    
    pitches = [
        {
            "game_date": pitch.game_date.strftime('%Y-%m-%d') if pitch.game_date else None,
            "pitch_type": pitch.pitch_type,
            "horz_break": pitch.horz_break,
            "induced_vert_break": pitch.induced_vert_break,
            "rel_speed": pitch.rel_speed,
            "usage": stats['pitch_usage'].get(pitch.pitch_type, 0) if stats else 0
        }
        for pitch in pitch_data
    ]

    result = {
        "pitch_data": pitches,
        "stats": stats
    }

    return jsonify(result), 200

@pitching_bp.route("/usage_by_date")
def get_pitch_usage_by_date():
    player_id = request.args.get("player_id")
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400

    usage_data = PitchingController.get_pitch_usage_by_date(player_id)
    if not usage_data:
        return jsonify({"error": "No data found for this player"}), 404

    return jsonify(usage_data), 200


@pitching_bp.route("/distribution")
def get_pitch_distribution():
    player_id = request.args.get("player_id")
    if not player_id:
        return jsonify({"error": "Player ID is required"}), 400

    distribution_data = PitchingController.get_pitch_distribution(player_id)
    if not distribution_data:
        return jsonify({"error": "No data found for this player"}), 404

    return jsonify(distribution_data), 200

@pitching_bp.route("/leaderboard")
def get_leaderboard():
    """Get pitching leaderboard statistics"""
    leaderboard = PitchingController.get_pitching_leaderboard()
    
    if not leaderboard:
        return jsonify({"error": "Unable to generate leaderboard"}), 500

    return jsonify({
        "success": True,
        "data": leaderboard
    }), 200