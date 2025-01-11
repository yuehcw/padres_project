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
from app.models import Player, PitchingInfo

def load_pitching_data(file_path):
    with open(file_path, "r") as file:
        reader = list(csv.DictReader(file))

        db.session.execute(text('TRUNCATE TABLE pitching_info RESTART IDENTITY;'))
        db.session.commit()

        with db.session.no_autoflush:
            for row in reader:
                if row["pitcher_team"] == "San Diego Padres":
                    player = Player.query.filter_by(
                        first_name=row["pitcher_name_first"], 
                        last_name=row["pitcher_name_last"]
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

                        try:
                            game_date = datetime.strptime(row["game_date"], "%Y-%m-%d").date() if row["game_date"] else None
                        except (ValueError, TypeError):
                            game_date = None

                        pitching_info = PitchingInfo(
                            player_id=player.player_id,
                            game_date=game_date,
                            game_bam_id=safe_int(row["game_bam_id"]),
                            at_bat_number=safe_int(row["at_bat_number"]),
                            inning=safe_int(row["inning"]),
                            pitch_seq=safe_int(row["pitch_seq"]),
                            pitch_type=row["pitch_type"],
                            horz_break=safe_float(row["horz_break"]),
                            induced_vert_break=safe_float(row["induced_vert_break"]),
                            rel_speed=safe_float(row["rel_speed"]),
                            pre_outs=safe_int(row["pre_outs"]),
                            post_outs=safe_int(row["post_outs"]),
                            pre_vscore=safe_int(row["pre_vscore"]),
                            post_vscore=safe_int(row["post_vscore"]),
                            pre_balls=safe_int(row["pre_balls"]),
                            pre_strikes=safe_int(row["pre_strikes"]),
                            post_balls=safe_int(row["post_balls"]),
                            post_strikes=safe_int(row["post_strikes"]),
                            event_type=row["event_type"],
                            description=row["description"],
                            spin_rate=safe_float(row["spin_rate"]),
                            spin_axis=safe_float(row["spin_axis"]),
                            zone_speed=safe_float(row["zone_speed"]),
                            plate_x=safe_float(row["plate_x"]),
                            plate_z=safe_float(row["plate_z"]),
                            extension=safe_float(row["extension"]),
                            tilt=row["tilt"],
                            hit_exit_speed=safe_float(row["hit_exit_speed"]),
                            hit_distance=safe_float(row["hit_distance"]),
                            hit_vertical_angle=safe_float(row["hit_vertical_angle"]),
                            hit_horizontal_angle=safe_float(row["hit_horizontal_angle"]),
                            in_play=row["in_play"].lower() == 'true' if row["in_play"] else False,
                            hit_trajectory=row["hit_trajectory"],
                            first_name=row["pitcher_name_first"],
                            last_name=row["pitcher_name_last"], 
                        )
                        db.session.add(pitching_info)

            db.session.commit()
            print("Pitching data successfully loaded.")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        file_path = current_dir.parent / "data" / "padres_project_data.csv"
        load_pitching_data(file_path)