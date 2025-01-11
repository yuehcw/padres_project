import csv
from datetime import datetime
import sys
from pathlib import Path
import pandas as pd

current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
sys.path.append(str(project_root))

# Constants for player data
PLAYER_DATA = {
    '650333': {  # Luis Arraez
        'age': 27,
        'height': 70,
        'weight': 175,
        'position': '1B',
        'birth_place': 'San Felipe, Venezuela',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39572.png&w=350&h=254'
    },
    '595777': {  # Jurickson Profar
        'age': 30,
        'height': 73,
        'weight': 185,
        'position': '3B',
        'birth_place': 'Willemstad, Curacao',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/31117.png&w=350&h=254'
    },
    '630105': {  # Jake Cronenworth
        'age': 30,
        'height': 75,
        'weight': 192,
        'position': '1B',
        'birth_place': 'St. Clair, Michigan',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36364.png&w=350&h=254'
    },
    '656302': {  # Dylan Cease
        'age': 29,
        'height': 74,
        'weight': 200,
        'position': 'SP',
        'birth_place': 'Milton, Georgia',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/34943.png&w=350&h=254'
    },
    '592518': {  # Manny Machado
        'age': 32,
        'height': 75,
        'weight': 218,
        'position': '3B',
        'birth_place': 'Hialeah, Florida',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/31097.png&w=350&h=254'
    },
    '456781': {  # Donovan Solano
        'age': 36,
        'height': 71,
        'weight': 205,
        'position': '3B',
        'birth_place': 'Barranquilla, Colombia',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/29703.png&w=350&h=254'
    },
    '701538': {  # Jackson Merrill
        'age': 21,
        'height': 75,
        'weight': 195,
        'position': 'CF',
        'birth_place': 'Severna Park, Maryland',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4872691.png&w=350&h=254'
    },
    '673490': {  # Ha-Seong Kim
        'age': 29,
        'height': 73,
        'weight': 168,
        'position': 'SS',
        'birth_place': 'Bucheon, South Korea',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4089862.png&w=350&h=254'
    },
    '543309': {  # Kyle Higashioka
        'age': 34,
        'height': 73,
        'weight': 205,
        'position': 'C',
        'birth_place': 'Huntington Beach, California',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30545.png&w=350&h=254'
    },
    '669369': {  # Bryce Johnson
        'age': 28,
        'height': 73,
        'weight': 185,
        'position': 'RF',
        'birth_place': 'Houston, Texas',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42056.png&w=350&h=254'
    },
    '663568': {  # Stephen Kolek
        'age': 27,
        'height': 75,
        'weight': 220,
        'position': 'RP',
        'birth_place': 'Shepherd, Texas',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/5190073.png&w=350&h=254'
    },
    '656354': {  # Austin Davis
        'age': 31,
        'height': 77,
        'weight': 245,
        'position': 'RP',
        'birth_place': 'Scottsdale, Arizona',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39078.png&w=350&h=254'
    },
    '660853': {  # Enyel De Los Santos
        'age': 29,
        'height': 75,
        'weight': 200,
        'position': 'RP',
        'birth_place': 'San Pedro de Macoris, Dominican Republic',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/35026.png&w=350&h=254'
    },
    '642180': {  # Tyler Wade
        'age': 30,
        'height': 73,
        'weight': 185,
        'position': '3B',
        'birth_place': 'Murrieta, California',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33878.png&w=350&h=254'
    },
    '666703': {  # Eguy Rosario
        'age': 25,
        'height': 67,
        'weight': 170,
        'position': '3B',
        'birth_place': 'La Romana, Dominican Republic',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36745.png&w=350&h=254'
    },
    '800049': {  # Adam Mazur
        'age': 23,
        'height': 76,
        'weight': 190,
        'position': 'SP',
        'birth_place': 'Woodbury, Minnesota',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/5061202.png&w=350&h=254'
    },
    '444482': {  # David Peralta
        'age': 37,
        'height': 74,
        'weight': 215,
        'position': 'RF',
        'birth_place': 'Valencia, Venezuela',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33384.png&w=350&h=254'
    },
    '673513': {  # Yuki Matsui
        'age': 29,
        'height': 67,
        'weight': 165,
        'position': 'RP',
        'birth_place': 'Iwate, Japan',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4142414.png&w=350&h=254'
    },
    '670970': {  # Adrian Morejon
        'age': 25,
        'height': 72,
        'weight': 225,
        'position': 'RP',
        'birth_place': 'Havana, Cuba',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40917.png&w=350&h=254'
    },
    '669093': {  # Jeremiah Estrada
        'age': 26,
        'height': 73,
        'weight': 185,
        'position': 'RP',
        'birth_place': 'Palm Desert, California',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/41014.png&w=350&h=254'
    },
    '663158': {  # Robert Suarez
        'age': 33,
        'height': 75,
        'weight': 225,
        'position': 'RP',
        'birth_place': 'Caracas, Venezuela',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4148749.png&w=350&h=254'
    },
    '650633': {  # Michael King
        'age': 29,
        'height': 75,
        'weight': 210,
        'position': 'SP',
        'birth_place': 'Rochester, New York',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40429.png&w=350&h=254'
    },
    '664954': {  # Brett Sullivan
        'age': 30,
        'height': 72,
        'weight': 195,
        'position': 'C',
        'birth_place': 'Stockton, California',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39913.png&w=350&h=254'
    },
    '681190': {  # Randy Vasquez
        'age': 26,
        'height': 72,
        'weight': 165,
        'position': 'SP',
        'birth_place': 'Navarrete, Dominican Republic',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4722847.png&w=350&h=254'
    },
    '593974': {  # Wandy Peralta
        'age': 33,
        'height': 74,
        'weight': 225,
        'position': 'RP',
        'birth_place': 'San Francisco de Macoris, Dominican Republic',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36036.png&w=350&h=254'
    },
    '663362': {  # Matt Waldron
        'age': 28,
        'height': 74,
        'weight': 195,
        'position': 'SP',
        'birth_place': 'Omaha, Nebraska',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4020158.png&w=350&h=254'
    },
    '669134': {  # Luis Campusano
        'age': 26,
        'height': 72,
        'weight': 232,
        'position': 'C',
        'birth_place': 'Augusta, Georgia',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40521.png&w=350&h=254'
    },
    '593428': {  # Xander Bogaerts
        'age': 32,
        'height': 74,
        'weight': 190,
        'position': '2B',
        'birth_place': 'Oranjestad, Aruba',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/31606.png&w=350&h=254'
    },
    '670810': {  # Logan Gillaspie
        'age': 27,
        'height': 74,
        'weight': 185,
        'position': 'RP',
        'birth_place': 'Bakersfield, California',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4905860.png&w=350&h=254'
    },
    '669308': {  # Sean Reynolds
        'age': 26,
        'height': 80,
        'weight': 237,
        'position': 'RP',
        'birth_place': 'Miami',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/41691.png&w=350&h=254'
    },
    '689690': {  # Alek Jacob
        'age': 26,
        'height': 74,
        'weight': 185,
        'position': 'RP',
        'birth_place': 'Spokane, Washington',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/4346118.png&w=350&h=254'
    },
    '592094': {  # Jason Adam
        'age': 33,
        'height': 74,
        'weight': 225,
        'position': 'RP',
        'birth_place': 'Omaha, Nebraska',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32145.png&w=350&h=254'
    },
    '663773': {  # Bryan Hoeing
        'age': 28,
        'height': 77,
        'weight': 225,
        'position': 'RP',
        'birth_place': 'Louisville, Kentucky',
        'image_url': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42200.png&w=350&h=254'
    }
}

def generate_player_info_csv(game_data_path, output_path):
    padres_players = {}
    
    with open(game_data_path, "r") as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            if row["batter_team"] == "San Diego Padres":
                bam_id = int(row["batter_bam_id"]) if row["batter_bam_id"] else None
                if bam_id:
                    padres_players[bam_id] = {
                        'first_name': row["batter_name_first"],
                        'last_name': row["batter_name_last"],
                        'position': str(row["batter_position"]) if row["batter_position"] else None,
                        'bam_id': bam_id
                    }
            
            if row["pitcher_team"] == "San Diego Padres":
                bam_id = int(row["pitcher_bam_id"]) if row["pitcher_bam_id"] else None
                if bam_id:
                    padres_players[bam_id] = {
                        'first_name': row["pitcher_name_first"],
                        'last_name': row["pitcher_name_last"],
                        'position': "P",
                        'bam_id': bam_id
                    }

    player_info = []
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    for bam_id, player in padres_players.items():
        additional_info = PLAYER_DATA.get(str(bam_id), {})
        
        player_info.append({
            'bam_id': player['bam_id'],
            'first_name': player['first_name'],
            'last_name': player['last_name'],
            'age': additional_info.get('age'),
            'height': additional_info.get('height'),
            'weight': additional_info.get('weight'),
            'position': additional_info.get('position', player['position']),
            'birth_place': additional_info.get('birth_place'),
            'image_url': additional_info.get('image_url'),
            'created_at': now,
            'updated_at': now
        })

    df = pd.DataFrame(player_info)
    df.to_csv(output_path, index=False)
    print(f"Generated player info CSV at {output_path}")
    print(f"Total players: {len(player_info)}")
    
    print("\nPlayers in generated CSV:")
    for player in player_info:
        print(f"{player['first_name']} {player['last_name']} ({player['position']})")
        if str(player['bam_id']) in PLAYER_DATA:
            print(f"  Age: {player['age']}")
            print(f"  Height: {player['height']} inches")
            print(f"  Weight: {player['weight']} lbs")
            print(f"  Birth Place: {player['birth_place']}")
            print(f"  Image URL available: Yes")
        else:
            print("  No additional information available")
        print()

if __name__ == "__main__":
    game_data_path = project_root / "data" / "padres_project_data.csv"
    output_path = project_root / "data" / "player_info.csv"
    generate_player_info_csv(game_data_path, output_path)