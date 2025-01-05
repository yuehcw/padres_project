from .. import db
from datetime import datetime

class Player(db.Model):
    __tablename__ = 'player_bio'

    player_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=True)
    height = db.Column(db.String(10), nullable=True)
    weight = db.Column(db.Numeric(5, 2), nullable=True)
    position = db.Column(db.String(30), nullable=True)
    birth_place = db.Column(db.String(50), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
