from sqlalchemy import func
from sqlalchemy.sql import case, and_ 
from collections import defaultdict
from ..models.pitching import PitchingInfo
import numpy as np

class PitchingController:
    @staticmethod
    def calculate_pitching_stats(player_id):
        """Calculate all pitching statistics for a player"""
        pitches = PitchingInfo.query.filter_by(player_id=player_id).order_by(
            PitchingInfo.game_date,
            PitchingInfo.game_bam_id,
            PitchingInfo.inning,
            PitchingInfo.at_bat_number,
            PitchingInfo.pitch_seq
        ).all()
        
        if not pitches:
            return None

        unique_games = len(set(pitch.game_bam_id for pitch in pitches))

        game_inning_outs = defaultdict(int)
        for pitch in pitches:
            if pitch.post_outs is not None and pitch.pre_outs is not None:
                game_key = (pitch.game_bam_id, pitch.inning)
                outs = pitch.post_outs - pitch.pre_outs
                if outs > 0:
                    game_inning_outs[game_key] += outs
        total_outs = sum(outs for outs in game_inning_outs.values())
        innings_pitched = total_outs / 3

        strikeouts = len(set(
            (pitch.game_bam_id, pitch.at_bat_number)
            for pitch in pitches 
            if pitch.event_type == 'strikeout'
        ))

        walks = len(set(
            (pitch.game_bam_id, pitch.at_bat_number)
            for pitch in pitches 
            if pitch.event_type == 'walk'
        ))

        hits = len(set(
            (pitch.game_bam_id, pitch.at_bat_number)
            for pitch in pitches 
            if pitch.event_type in ['single', 'double', 'triple', 'home_run']
        ))

        earned_runs = 0
        current_game = None
        inning_runs = defaultdict(int)
        processed_abs = set()

        for pitch in pitches:
            if current_game != pitch.game_bam_id:
                current_game = pitch.game_bam_id
                inning_runs.clear()
                processed_abs.clear()

            ab_key = (pitch.game_bam_id, pitch.at_bat_number)
            if ab_key not in processed_abs:
                if (pitch.event_type in [
                    'single', 'double', 'triple', 'home_run',  
                    'sacrifice_fly', 'sacrifice_bunt',         
                    'field_out', 'force_out', 'ground_out'    
                ] and pitch.post_vscore is not None 
                   and pitch.pre_vscore is not None 
                   and pitch.post_vscore > pitch.pre_vscore):
                    
                    run_diff = pitch.post_vscore - pitch.pre_vscore
                    inning_key = (pitch.game_bam_id, pitch.inning)
                    inning_runs[inning_key] += run_diff
                    earned_runs += run_diff

                processed_abs.add(ab_key)

        era = (earned_runs * 9) / innings_pitched if innings_pitched > 0 else 0
        whip = (walks + hits) / innings_pitched if innings_pitched > 0 else 0

        total_pitches = len(pitches)
        pitch_usage = defaultdict(int)
        
        for pitch in pitches:
            if pitch.pitch_type:
                pitch_usage[pitch.pitch_type] += 1
        
        pitch_usage = {
            pitch_type: (count / total_pitches) * 100 
            for pitch_type, count in pitch_usage.items()
        }

        return {
            'games': unique_games,
            'innings_pitched': round(innings_pitched, 1),
            'strikeouts': strikeouts,
            'earned_runs': earned_runs,
            'walks': walks,
            'hits': hits,
            'era': round(era, 2),
            'whip': round(whip, 2),
            'pitch_usage': pitch_usage
        }

    @staticmethod
    def get_pitch_movement_data(player_id):
        """Get individual pitch movement data"""
        return PitchingInfo.query.filter_by(player_id=player_id).all()
    
    @staticmethod
    def get_pitch_usage_by_date(player_id):
        """Get pitch usage (percentage and quantity) grouped by date and pitch type"""
        pitches = PitchingInfo.query.filter_by(player_id=player_id)\
            .order_by(PitchingInfo.game_date)\
            .all()
        
        if not pitches:
            return None

        usage_data = defaultdict(lambda: defaultdict(int))
        total_pitches_by_date = defaultdict(int)

        for pitch in pitches:
            if pitch.game_date and pitch.pitch_type:
                if pitch.pitch_type not in ['4S', '2S', 'SL', 'CB', 'SW', 'CH', 'CT', 'SP', 'KN']:
                    continue
                    
                usage_data[pitch.game_date][pitch.pitch_type] += 1
                total_pitches_by_date[pitch.game_date] += 1

        usage_statistics = []
        for date, pitch_counts in sorted(usage_data.items()):
            total_pitches = total_pitches_by_date[date]
            if total_pitches > 0:  
                for pitch_type, count in pitch_counts.items():
                    usage_statistics.append({
                        "date": date.strftime('%Y-%m-%d'),
                        "pitch_type": pitch_type,
                        "quantity": count,
                        "percentage": round((count / total_pitches) * 100, 1)
                    })

        return usage_statistics
    
    @staticmethod
    def get_pitch_distribution(player_id):
        """Get pitch distribution data for velocity chart"""
        try:
            pitches = PitchingInfo.query.filter_by(player_id=player_id)\
                .filter(PitchingInfo.rel_speed.isnot(None))\
                .filter(PitchingInfo.pitch_type.isnot(None))\
                .all()
            
            if not pitches:
                return None

            pitch_groups = defaultdict(list)
            for pitch in pitches:
                if pitch.pitch_type not in ['4S', '2S', 'SL', 'CB', 'SW', 'CH', 'CT', 'SP', 'KN']:
                    continue
                pitch_groups[pitch.pitch_type].append(pitch.rel_speed)

            from scipy import stats

            distribution_data = []
            for pitch_type, speeds in pitch_groups.items():
                if len(speeds) < 2:
                    continue

                speeds_array = np.array(speeds)
                
                scott_factor = len(speeds) ** (-1./5)  
                adjusted_bw = scott_factor * 0.8  
                
                kde = stats.gaussian_kde(speeds_array, bw_method=adjusted_bw)
                
                x_range = np.linspace(70, 100, 62) 
                density = kde(x_range)
                
                raw_peak_idx = np.argmax(density)
                raw_peak = density[raw_peak_idx]

                scale_factors = {
                    '4S': 29.7 / 100,  
                    'SL': 27.3 / 100,  
                    'SP': 35.0 / 100, 
                    'SW': 28.6 / 100   
                }
                
                scale_factor = scale_factors.get(pitch_type, 0.3)  
                density_normalized = (density / raw_peak) * 100 * scale_factor
                
                peak_idx = np.argmax(density_normalized)
                peak = {
                    'speed': float(x_range[peak_idx]),
                    'frequency': float(density_normalized[peak_idx])
                }

                points = []
                for i in range(len(x_range)):
                    points.append({
                        'speed': float(x_range[i]),
                        'frequency': float(density_normalized[i])
                    })

                distribution_data.append({
                    'pitch_type': pitch_type,
                    'distribution': points,
                    'peak': peak,
                    'total_count': len(speeds)
                })

            return distribution_data

        except Exception as e:
            print(f"Error in get_pitch_distribution: {str(e)}")
            return None
        


    @staticmethod
    def get_pitching_leaderboard():
        """Generate pitching leaderboard statistics following Baseball Savant format."""
        try:
            bbe_subquery = (
                PitchingInfo.query
                .with_entities(
                    PitchingInfo.player_id,
                    func.count().label('bbe')
                )
                .filter(PitchingInfo.in_play == True)
                .group_by(PitchingInfo.player_id)
                .subquery()
            )

            query = (
                PitchingInfo.query
                .with_entities(
                    PitchingInfo.player_id,
                    PitchingInfo.first_name,
                    PitchingInfo.last_name,
                    bbe_subquery.c.bbe.label('bbe'),
                    func.avg(PitchingInfo.hit_vertical_angle).label('launch_angle'),
                    (func.count(case(
                        (and_(
                            PitchingInfo.hit_vertical_angle >= 8,
                            PitchingInfo.hit_vertical_angle <= 32
                        ), 1)
                    )) * 100.0 / func.count()).label('la_sweet_spot_pct'),
                    func.avg(PitchingInfo.hit_exit_speed).label('avg_exit_velo'),
                    func.max(PitchingInfo.hit_exit_speed).label('max_exit_velo'),
                    func.percentile_cont(0.5).within_group(
                        PitchingInfo.hit_exit_speed.desc()
                    ).label('ev50'),
                    (func.count(case(
                        (PitchingInfo.hit_exit_speed >= 95, 1)
                    )) * 100.0 / func.nullif(func.count(), 0)).label('hard_hit_pct'),
                    func.avg(PitchingInfo.hit_distance).label('avg_distance'),
                    func.max(PitchingInfo.hit_distance).label('max_distance'),
                    func.count(case(
                        (and_(
                            PitchingInfo.hit_exit_speed >= 98,
                            PitchingInfo.hit_vertical_angle.between(8, 32)
                        ), 1)
                    )).label('barrels'),
                    (func.count(case(
                        (and_(
                            PitchingInfo.hit_exit_speed >= 98,
                            PitchingInfo.hit_vertical_angle.between(8, 32)
                        ), 1)
                    )) * 100.0 / func.nullif(func.count(), 0)).label('barrel_pct'),
                    func.avg(PitchingInfo.rel_speed).label('avg_velocity'),
                    func.max(PitchingInfo.rel_speed).label('max_velocity'),
                    func.avg(PitchingInfo.spin_rate).label('avg_spin_rate'),
                    func.coalesce(
                        func.count(case(
                            (PitchingInfo.hit_exit_speed >= 95, 1)
                        )), 0
                    ).label('hard_hits_calculated')
                )
                .outerjoin(bbe_subquery, PitchingInfo.player_id == bbe_subquery.c.player_id)
                .filter(PitchingInfo.in_play == True)
                .group_by(
                    PitchingInfo.player_id,
                    PitchingInfo.first_name,
                    PitchingInfo.last_name,
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
                    'la_sweet_spot_pct': round(row.la_sweet_spot_pct, 1) if row.la_sweet_spot_pct else 0,
                    'avg_exit_velo': round(row.avg_exit_velo, 1) if row.avg_exit_velo else 0,
                    'max_exit_velo': round(row.max_exit_velo, 1) if row.max_exit_velo else 0,
                    'ev50': round(row.ev50, 1) if row.ev50 else 0,
                    'hard_hit_pct': round(row.hard_hit_pct, 1) if row.hard_hit_pct else 0,
                    'avg_distance': round(row.avg_distance, 0) if row.avg_distance else 0,
                    'max_distance': round(row.max_distance, 0) if row.max_distance else 0,
                    'barrels': row.barrels or 0,
                    'barrel_pct': round(row.barrel_pct, 1) if row.barrel_pct else 0,
                    'avg_velocity': round(row.avg_velocity, 1) if row.avg_velocity else 0,
                    'max_velocity': round(row.max_velocity, 1) if row.max_velocity else 0,
                    'avg_spin_rate': round(row.avg_spin_rate, 0) if row.avg_spin_rate else 0,
                    'hard_hits_calculated': row.hard_hits_calculated or 0
                })

            return sorted(result, key=lambda x: x['avg_exit_velo'])

        except Exception as e:
            import traceback
            print(f"Error in get_pitching_leaderboard: {str(e)}")
            print(traceback.format_exc())
            return None