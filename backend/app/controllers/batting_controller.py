from sqlalchemy import func
from sqlalchemy.sql import case, and_ 
from collections import defaultdict
from ..models.batting import BattingInfo
import numpy as np
import math

class BattingController:
    @staticmethod
    def calculate_batting_stats(player_id):
        """Calculate all batting statistics for a player with added debugging."""
        at_bats = BattingInfo.query\
            .filter_by(player_id=player_id)\
            .with_entities(
                BattingInfo.game_date,
                BattingInfo.game_bam_id,
                BattingInfo.at_bat_number,
                BattingInfo.inning,
                BattingInfo.event_type,
                BattingInfo.description,
                BattingInfo.hit_trajectory,
                BattingInfo.pre_r1_bam_id,
                BattingInfo.post_r1_bam_id,
                BattingInfo.pre_r2_bam_id,
                BattingInfo.post_r2_bam_id
            )\
            .order_by(
                BattingInfo.game_date,
                BattingInfo.game_bam_id,
                BattingInfo.inning,
                BattingInfo.at_bat_number
            )\
            .distinct()\
            .all()

        stats = defaultdict(int)
        processed_abs = set()

        for ab in at_bats:
            ab_key = (ab.game_bam_id, ab.at_bat_number)
            if ab_key in processed_abs:
                continue

            event = ab.event_type.lower().strip() if ab.event_type else ""
            desc = ab.description.lower().strip() if ab.description else ""

            if not event and not desc:
                continue

            stats['PA'] += 1

            if 'home_run' in event or 'homers' in desc or 'hits a home run' in desc:
                stats['HR'] += 1
                stats['H'] += 1
                stats['AB'] += 1
            elif 'double' in event or 'doubles' in desc:
                stats['2B'] += 1
                stats['H'] += 1
                stats['AB'] += 1
            elif 'triple' in event or 'triples' in desc:
                stats['3B'] += 1
                stats['H'] += 1
                stats['AB'] += 1
            elif 'single' in event or 'singles' in desc:
                stats['1B'] += 1
                stats['H'] += 1
                stats['AB'] += 1
            elif 'walk' in event or 'walks' in desc:
                stats['BB'] += 1
            elif 'hit_by_pitch' in event or 'hit by pitch' in desc:
                stats['HBP'] += 1
            elif 'sacrifice_fly' in event or 'sacrifice fly' in desc:
                stats['SF'] += 1
            else:
                stats['AB'] += 1

            if ((ab.pre_r1_bam_id and ab.post_r1_bam_id and ab.pre_r1_bam_id != ab.post_r1_bam_id) or
                (ab.pre_r2_bam_id and ab.post_r2_bam_id and ab.pre_r2_bam_id != ab.post_r2_bam_id)):
                stats['SB'] += 1

            processed_abs.add(ab_key)

        if stats['AB'] > 0:
            stats['AVG'] = round(stats['H'] / stats['AB'], 3)
            total_bases = stats['1B'] + (2 * stats['2B']) + (3 * stats['3B']) + (4 * stats['HR'])
            stats['SLG'] = round(total_bases / stats['AB'], 3)
        else:
            stats['AVG'], stats['SLG'] = 0, 0

        denominator_pa = stats['AB'] + stats['BB'] + stats['HBP'] + stats['SF']
        if denominator_pa > 0:
            stats['OBP'] = round((stats['H'] + stats['BB'] + stats['HBP']) / denominator_pa, 3)
        else:
            stats['OBP'] = 0

        stats['OPS'] = round(stats['OBP'] + stats['SLG'], 3)

        return dict(stats)


    @staticmethod
    def get_spray_chart_data(player_id):
        """Get hit location data for spray chart visualization"""
        hits = BattingInfo.query\
            .filter_by(player_id=player_id)\
            .filter(BattingInfo.hit_distance.isnot(None))\
            .filter(BattingInfo.hit_horizontal_angle.isnot(None))\
            .with_entities(
                BattingInfo.game_bam_id,
                BattingInfo.at_bat_number,
                BattingInfo.event_type,
                BattingInfo.hit_trajectory,
                BattingInfo.hit_distance,
                BattingInfo.hit_horizontal_angle,
                BattingInfo.hit_vertical_angle,
                BattingInfo.hit_exit_speed,
                BattingInfo.game_date
                
            )\
            .distinct()\
            .all()
            
        if not hits:
            return None

        spray_chart_data = []
        processed_hits = set()
        
        for hit in hits:
            hit_key = (hit.game_bam_id, hit.at_bat_number)
            if hit_key in processed_hits:
                continue
                
            event = hit.event_type.lower() if hit.event_type else ""
            
            if 'home_run' in event or 'home run' in event:
                hit_type = 'HOME RUN'
            elif 'triple' in event:
                hit_type = 'TRIPLE'
            elif 'double' in event:
                hit_type = 'DOUBLE'
            elif 'single' in event:
                hit_type = 'SINGLE'
            else:
                continue
            
            angle = hit.hit_horizontal_angle
            if angle > 180:
                angle -= 360
            angle = max(-45, min(45, angle))
            
            spray_chart_data.append({
                'type': hit_type,
                'distance': round(hit.hit_distance, 1),
                'exit_speed': round(hit.hit_exit_speed, 1) if hit.hit_exit_speed else 0,
                'hit_angle': angle,
                'launch_angle': round(hit.hit_vertical_angle, 1) if hit.hit_vertical_angle else 0,
                'game_date': hit.game_date.strftime('%Y-%m-%d')
            })
            
            processed_hits.add(hit_key)
            
        # Print debug info
        # print("\nSpray Chart Debug:")
        # hit_types = defaultdict(int)
        # for hit in spray_chart_data:
        #     hit_types[hit['type']] += 1
        # print(f"Total hits plotted: {len(spray_chart_data)}")
        # print("Hit distribution:", dict(hit_types))
        
        return spray_chart_data
    
    @staticmethod
    def get_zone_heatmap(player_id):
        """Generate heatmap data for strike zone metrics."""
        try:
            query = BattingInfo.query.filter_by(player_id=player_id).with_entities(
                BattingInfo.plate_x,
                BattingInfo.plate_z,
                BattingInfo.swing,
                BattingInfo.contact,
                BattingInfo.called_strike,
                BattingInfo.swinging_strike,
                BattingInfo.ball,
                BattingInfo.pre_strikes,
                BattingInfo.post_strikes,
                BattingInfo.at_bat_number,
                BattingInfo.in_play
            ).all()

            zone_data = []
            for x in range(3):
                for z in range(2, -1, -1):  
                    zone_data.append({
                        "x": x,
                        "z": z,
                        "pitch_percent": 0,
                        "total_pitches": 0,
                        "swing_percent": 0,
                        "swings": 0,
                        "whiffs": 0,
                        "strikeouts": 0,
                        "k_percent": 0,
                        "whiff_percent": 0,
                        "swinging_strikes": 0,
                        "called_strikes": 0
                    })

            at_bats = {}
            
            valid_pitches = [p for p in query if p.plate_x is not None and p.plate_z is not None]
            total_pitches = len(valid_pitches)

            for pitch in valid_pitches:
                x_zone = 1  
                z_zone = 1  
                
                if pitch.plate_x < -0.83:
                    x_zone = 0
                elif pitch.plate_x > 0.83:
                    x_zone = 2
                    
                if pitch.plate_z < 1.5:
                    z_zone = 0
                elif pitch.plate_z > 2.5:
                    z_zone = 2

                zone_index = x_zone * 3 + z_zone
                zone = zone_data[zone_index]
                
                zone["total_pitches"] += 1

                if pitch.swing:
                    zone["swings"] += 1
                    if not pitch.contact and not pitch.in_play:
                        zone["whiffs"] += 1
                        zone["swinging_strikes"] += 1

                if pitch.called_strike:
                    zone["called_strikes"] += 1

                if pitch.post_strikes == 3:
                    if pitch.swinging_strike or pitch.called_strike:
                        zone["strikeouts"] += 1

            for zone in zone_data:
                if zone["total_pitches"] > 0:
                    zone["pitch_percent"] = round((zone["total_pitches"] / total_pitches * 100), 1)
                    
                    zone["swing_percent"] = round((zone["swings"] / zone["total_pitches"] * 100), 1)
                    
                    zone["k_percent"] = round((zone["strikeouts"] / zone["total_pitches"] * 100), 1)
                
                if zone["swings"] > 0:
                    zone["whiff_percent"] = round((zone["whiffs"] / zone["swings"] * 100), 1)

                # Debug info
                # print(f"Zone ({zone['x']}, {zone['z']}): ")
                # print(f"  Total Pitches: {zone['total_pitches']}")
                # print(f"  Swings: {zone['swings']}")
                # print(f"  Swing %: {zone['swing_percent']}")
                # print(f"  Whiffs: {zone['whiffs']}")
                # print(f"  Whiff %: {zone['whiff_percent']}")
                # print(f"  Strikeouts: {zone['strikeouts']}")
                # print(f"  K %: {zone['k_percent']}")

            return zone_data

        except Exception as e:
            import traceback
            print(f"Error in get_zone_heatmap: {str(e)}")
            print(traceback.format_exc())
            return None
        

    @staticmethod
    def get_pitch_trends(player_id):
        """Generate pitch type data grouped by date."""
        try:
            query = (BattingInfo.query
                    .filter_by(player_id=player_id)
                    .with_entities(
                        BattingInfo.game_date,
                        BattingInfo.pitch_type
                    )
                    .order_by(BattingInfo.game_date)
                    .all())

            pitch_trends = {}
            
            fastball_types = ['4S', '2S', 'CT', 'SI']
            breaking_types = ['SL', 'CB', 'KN', 'SW']
            offspeed_types = ['SP', 'CH']
                
            for pitch in query:
                date_str = pitch.game_date.strftime('%Y-%m-%d')
                
                if date_str not in pitch_trends:
                    pitch_trends[date_str] = {
                        "date": date_str,
                        "displayDate": pitch.game_date.strftime('%B %d'),
                        "Fastball": 0,
                        "Breaking": 0,
                        "Offspeed": 0,
                        "total": 0
                    }
                
                pitch_type = pitch.pitch_type
                
                if pitch_type in fastball_types:
                    pitch_trends[date_str]["Fastball"] += 1
                elif pitch_type in breaking_types:
                    pitch_trends[date_str]["Breaking"] += 1
                elif pitch_type in offspeed_types:
                    pitch_trends[date_str]["Offspeed"] += 1
                
                pitch_trends[date_str]["total"] += 1

            result = []
            for date_data in pitch_trends.values():
                total = date_data["total"]
                if total > 0:
                    fast_pct = date_data["Fastball"] / total * 100
                    break_pct = date_data["Breaking"] / total * 100
                    off_pct = date_data["Offspeed"] / total * 100
                    
                    date_data["FastballPct"] = round(fast_pct, 1)
                    date_data["BreakingPct"] = round(break_pct, 1)
                    
                    date_data["OffspeedPct"] = round(100 - date_data["FastballPct"] - date_data["BreakingPct"], 1)
                    
                    if date_data["OffspeedPct"] < 0:
                        max_pct = max(date_data["FastballPct"], date_data["BreakingPct"])
                        if date_data["FastballPct"] == max_pct:
                            date_data["FastballPct"] += date_data["OffspeedPct"]
                        else:
                            date_data["BreakingPct"] += date_data["OffspeedPct"]
                        date_data["OffspeedPct"] = 0

                result.append(date_data)

            result.sort(key=lambda x: x["date"])
            return result

        except Exception as e:
            import traceback
            print(f"Error in get_pitch_trends: {str(e)}")
            print(traceback.format_exc())
            return None
        

    @staticmethod
    def get_batting_leaderboard():
        """Generate batting leaderboard statistics following Baseball Savant format."""
        try:
            bbe_subquery = (
                BattingInfo.query
                .with_entities(
                    BattingInfo.player_id,
                    func.count().label('bbe')
                )
                .filter(BattingInfo.in_play == True)
                .group_by(BattingInfo.player_id)
                .subquery()
            )

            query = (
                BattingInfo.query
                .with_entities(
                    BattingInfo.player_id,
                    BattingInfo.first_name,
                    BattingInfo.last_name,
                    bbe_subquery.c.bbe.label('bbe'),
                    func.avg(BattingInfo.hit_vertical_angle).label('launch_angle'),
                    func.max(BattingInfo.hit_exit_speed).label('max_exit_velo'),
                    func.avg(BattingInfo.hit_exit_speed).label('avg_exit_velo'),
                    func.percentile_cont(0.5).within_group(
                        BattingInfo.hit_exit_speed.desc()
                    ).label('ev50'),
                    func.max(BattingInfo.hit_distance).label('max_distance'),
                    func.avg(BattingInfo.hit_distance).label('avg_distance'),
                    (func.count(case(
                        (BattingInfo.hit_exit_speed >= 95, 1)
                    ))).label('ninety_five_plus'),
                    (func.count(case(
                        (BattingInfo.hit_exit_speed >= 95, 1)
                    )) * 100.0 / func.nullif(func.count(), 0)).label('hard_hit_pct'),
                    (func.count(case(
                        (and_(
                            BattingInfo.hit_vertical_angle >= 8,
                            BattingInfo.hit_vertical_angle <= 32
                        ), 1)
                    )) * 100.0 / func.count()).label('la_sweet_spot_pct'),
                    func.count(case(
                        (and_(
                            BattingInfo.hit_exit_speed >= 98,
                            BattingInfo.hit_vertical_angle.between(8, 32)
                        ), 1)
                    )).label('barrels'),
                    (func.count(case(
                        (and_(
                            BattingInfo.hit_exit_speed >= 98,
                            BattingInfo.hit_vertical_angle.between(8, 32)
                        ), 1)
                    )) * 100.0 / func.nullif(func.count(), 0)).label('barrel_pct')
                )
                .outerjoin(bbe_subquery, BattingInfo.player_id == bbe_subquery.c.player_id)
                .filter(BattingInfo.in_play == True)
                .group_by(
                    BattingInfo.player_id,
                    BattingInfo.first_name,
                    BattingInfo.last_name,
                    bbe_subquery.c.bbe
                )
                .all()
            )

            result = []
            for row in query:
                result.append({
                    'player_id': row.player_id,
                    'name': f"{row.first_name} {row.last_name}",
                    'bbe': row.bbe or 0,
                    'launch_angle': round(row.launch_angle, 1) if row.launch_angle else 0,
                    'max_exit_velo': round(row.max_exit_velo, 1) if row.max_exit_velo else 0,
                    'avg_exit_velo': round(row.avg_exit_velo, 1) if row.avg_exit_velo else 0,
                    'ev50': round(row.ev50, 1) if row.ev50 else 0,
                    'max_distance': round(row.max_distance, 0) if row.max_distance else 0,
                    'avg_distance': round(row.avg_distance, 0) if row.avg_distance else 0,
                    'ninety_five_plus': row.ninety_five_plus or 0,
                    'hard_hit_pct': round(row.hard_hit_pct, 1) if row.hard_hit_pct else 0,
                    'la_sweet_spot_pct': round(row.la_sweet_spot_pct, 1) if row.la_sweet_spot_pct else 0,
                    'barrels': row.barrels or 0,
                    'barrel_pct': round(row.barrel_pct, 1) if row.barrel_pct else 0
                })

            return sorted(result, key=lambda x: x['avg_exit_velo'], reverse=True)

        except Exception as e:
            import traceback
            print(f"Error in get_batting_leaderboard: {str(e)}")
            print(traceback.format_exc())
            return None