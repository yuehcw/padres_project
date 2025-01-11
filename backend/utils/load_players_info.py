# utils/load_players.py

import csv
from datetime import datetime
import sys
from pathlib import Path
from sqlalchemy import text
import pandas as pd

current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
sys.path.append(str(project_root))

from app import create_app 
from app import db
from app.models import Player

def load_players_from_csvs(game_data_path, player_info_path):
    """
    Load player data from both game data CSV and player info CSV
    """
    player_info_df = pd.read_csv(player_info_path)
    
    player_info_dict = {}
    for _, row in player_info_df.iterrows():
        player_info_dict[row['bam_id']] = {
            'first_name': row['first_name'],
            'last_name': row['last_name'],
            'age': row['age'],
            'height': row['height'],
            'weight': row['weight'],
            'position': row['position'],
            'birth_place': row['birth_place'],
            'image_url': row['image_url']
        }

    padres_players = {}
    
    with open(game_data_path, "r") as file:
        reader = csv.DictReader(file)
        
        db.session.execute(text('TRUNCATE TABLE player_bio RESTART IDENTITY CASCADE;'))
        db.session.commit()
        
        for row in reader:
            if row["batter_team"] == "San Diego Padres":
                bam_id = int(row["batter_bam_id"]) if row["batter_bam_id"] else None
                if bam_id and bam_id not in padres_players:
                    padres_players[bam_id] = {
                        'first_name': row["batter_name_first"],
                        'last_name': row["batter_name_last"],
                        'bam_id': bam_id,
                        'position': str(row["batter_position"]) if row["batter_position"] else None
                    }
            
            if row["pitcher_team"] == "San Diego Padres":
                bam_id = int(row["pitcher_bam_id"]) if row["pitcher_bam_id"] else None
                if bam_id and bam_id not in padres_players:
                    padres_players[bam_id] = {
                        'first_name': row["pitcher_name_first"],
                        'last_name': row["pitcher_name_last"],
                        'bam_id': bam_id,
                        'position': "P"
                    }
        
        for bam_id, player in padres_players.items():
            player_info = player_info_dict.get(bam_id, {})
            
            new_player = Player(
                first_name=player['first_name'],
                last_name=player['last_name'],
                bam_id=bam_id,
                position=player_info.get('position', player['position']),  
                age=player_info.get('age'),
                height=player_info.get('height'),
                weight=player_info.get('weight'),
                birth_place=player_info.get('birth_place'),
                image_url=player_info.get('image_url'),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.session.add(new_player)

        try:
            db.session.commit()
            print(f"Successfully loaded {len(padres_players)} players into the player_bio table.")
            
            print("\nLoaded Players:")
            for bam_id, player in padres_players.items():
                info = player_info_dict.get(bam_id, {})
                print(f"\n{player['first_name']} {player['last_name']} (BAM ID: {bam_id})")
                print(f"  Position: {info.get('position', player['position'])}")
                if bam_id in player_info_dict:
                    print(f"  Age: {info.get('age')}")
                    print(f"  Height: {info.get('height')} inches")
                    print(f"  Weight: {info.get('weight')} lbs")
                    print(f"  Birth Place: {info.get('birth_place')}")
                else:
                    print("  No additional information available")
                
        except Exception as e:
            db.session.rollback()
            print(f"Error loading players: {str(e)}")
            raise e

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        game_data_path = project_root / "data" / "padres_project_data.csv"
        player_info_path = project_root / "data" / "player_info.csv"
        load_players_from_csvs(game_data_path, player_info_path)