import csv
from datetime import datetime
import sys
from pathlib import Path
from sqlalchemy import text

current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
sys.path.append(str(project_root))

from app import create_app 
from app import db
from app.models import Player, BattingInfo

def load_batting_data(file_path):
    with open(file_path, "r") as file:
        reader = list(csv.DictReader(file))

        db.session.execute(text('TRUNCATE TABLE batting_info RESTART IDENTITY;'))
        db.session.commit()

        with db.session.no_autoflush:
            for row in reader:
                if row["batter_team"] == "San Diego Padres":
                    player = Player.query.filter_by(
                        first_name=row["batter_name_first"], 
                        last_name=row["batter_name_last"]
                    ).first()

                    if player:
                        def safe_float(value):
                            try:
                                return float(value) if value != '' else None
                            except (ValueError, TypeError):
                                return None

                        def safe_int(value):
                            try:
                                return int(value) if value != '' else None
                            except (ValueError, TypeError):
                                return None
                                
                        def safe_bool(value):
                            if value is None or value == '':
                                return None
                            if isinstance(value, str):
                                value = value.upper()
                                if value == 'TRUE':
                                    return True
                                if value == 'FALSE':
                                    return False
                            return None

                        try:
                            game_date = datetime.strptime(row["game_date"], "%Y-%m-%d").date() if row["game_date"] else None
                        except (ValueError, TypeError):
                            game_date = None

                        batting_info = BattingInfo(
                            player_id=player.player_id,
                            game_date=game_date,
                            game_bam_id=safe_int(row["game_bam_id"]),
                            at_bat_number=safe_int(row["at_bat_number"]),
                            inning=safe_int(row["inning"]),
                            pitch_seq=safe_int(row["pitch_seq"]),
                            event_type=row["event_type"],
                            description=row["description"],
                            hit_trajectory=row["hit_trajectory"],
                            hit_exit_speed=safe_float(row["hit_exit_speed"]),
                            hit_vertical_angle=safe_float(row["hit_vertical_angle"]),
                            hit_horizontal_angle=safe_float(row["hit_horizontal_angle"]),
                            hit_distance=safe_float(row["hit_distance"]),
                            hit_bearing=safe_float(row["hit_bearing"]),
                            pre_balls=safe_int(row["pre_balls"]),
                            pre_strikes=safe_int(row["pre_strikes"]),
                            post_balls=safe_int(row["post_balls"]),
                            post_strikes=safe_int(row["post_strikes"]),
                            pre_vscore=safe_int(row["pre_vscore"]),
                            post_vscore=safe_int(row["post_vscore"]),
                            pre_basecode=safe_int(row["pre_basecode"]),
                            post_basecode=safe_int(row["post_basecode"]),
                            pre_r1_bam_id=safe_int(row["pre_r1_bam_id"]),
                            pre_r2_bam_id=safe_int(row["pre_r2_bam_id"]),
                            pre_r3_bam_id=safe_int(row["pre_r3_bam_id"]),
                            post_r1_bam_id=safe_int(row["post_r1_bam_id"]),
                            post_r2_bam_id=safe_int(row["post_r2_bam_id"]),
                            post_r3_bam_id=safe_int(row["post_r3_bam_id"]),
                            swing=safe_bool(row["swing"]),
                            contact=safe_bool(row["contact"]),
                            in_play=safe_bool(row["in_play"]),
                            pitch_type=row["pitch_type"],
                            plate_x=safe_float(row["plate_x"]),
                            plate_z=safe_float(row["plate_z"]),
                            called_strike=safe_bool(row["called_strike"]),
                            swinging_strike=safe_bool(row["swinging_strike"]),
                            chase=safe_bool(row["chase"]),
                            ball=safe_bool(row["ball"]),
                            first_name=row["batter_name_first"],
                            last_name=row["batter_name_last"],

                        )
                        db.session.add(batting_info)

            db.session.commit()
            print("Batting data successfully loaded.")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        file_path = current_dir.parent / "data" / "padres_project_data.csv"
        load_batting_data(file_path)