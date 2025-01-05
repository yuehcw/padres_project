from .player_bio_route import player_bp

def init_routes(app):
    """Initialize all route blueprints"""
    app.register_blueprint(player_bp, url_prefix='/player')
    return app