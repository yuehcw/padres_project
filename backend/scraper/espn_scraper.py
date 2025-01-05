import os
import sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
sys.path.append(str(parent_dir))

from app import db, create_app
from app.models import Player

def convert_height_to_decimal(height_str):
    """Convert height from '6' 3"' format to decimal feet (e.g., 6.25)"""
    try:
        height_parts = height_str.replace(' ', '').replace('"', '').split("'")
        feet = int(height_parts[0])
        inches = int(height_parts[1]) if height_parts[1] else 0
        return round(feet + (inches / 12), 2)
    except (IndexError, ValueError):
        return None

def get_espn_image_url(img_tag):
    """Extract and process ESPN CDN image URL"""
    if not img_tag:
        return None

    src = img_tag.get('src')
    if not src:
        return None

    if src.startswith('https://a.espncdn.com/'):
        base_url = src.split('&h=')[0] if '&h=' in src else src
        return base_url

    alt = img_tag.get('alt')
    if alt and alt.startswith('https://a.espncdn.com/'):
        return alt.split('&h=')[0] if '&h=' in alt else alt

    return src

def scrape_and_store():
    """Scrape player data from ESPN and store in database"""
    url = "https://www.espn.com/mlb/team/roster/_/name/sd/san-diego-padres"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        player_tables = soup.find_all('div', class_='Table__ScrollerWrapper')
        players = []
        
        if player_tables:
            print(f"Found {len(player_tables)} player tables")
            
            for table in player_tables:
                rows = table.find_all('tr', class_='Table__TR')
                
                for row in rows:
                    try:
                        cells = row.find_all('td', class_='Table__TD')
                        if len(cells) < 8:
                            continue
                            
                        name_cell = cells[1]
                        name_link = name_cell.find('a')
                        if not name_link:
                            continue
                            
                        name_text = name_link.get_text(strip=True)
                        name_parts = name_text.split(' ', 1)
                        
                        if len(name_parts) < 2:
                            continue
                        
                        player_name = f"{name_parts[0]} {name_parts[1]}"
                        
                        img_tag = cells[0].find('img')
                        image_url = get_espn_image_url(img_tag)
                        
                        weight_text = cells[7].get_text(strip=True)
                        weight = int(weight_text.replace(' lbs', '')) if weight_text else None
                        
                        height_str = cells[6].get_text(strip=True)
                        height_decimal = convert_height_to_decimal(height_str)
                        
                        player = {
                            'first_name': name_parts[0],
                            'last_name': name_parts[1], 
                            'position': cells[2].get_text(strip=True),
                            'age': int(cells[5].get_text(strip=True)),
                            'height': height_decimal,
                            'weight': weight,
                            'birth_place': cells[8].get_text(strip=True),
                            'image_url': image_url,
                            'created_at': datetime.utcnow(),
                            'updated_at': datetime.utcnow()
                        }
                        players.append(player)
                        print(f"Processed player: {player_name} - Image URL: {image_url}")
                        
                    except Exception as e:
                        print(f"Error processing row: {e}")
                        continue

        print(f"Found total {len(players)} players")

        app = create_app()
        with app.app_context():
            for player_data in players:
                try:
                    existing_player = Player.query.filter_by(
                        first_name=player_data['first_name'],
                        last_name=player_data['last_name']
                    ).first()
                    
                    if existing_player:
                        print(f"Updating: {player_data['first_name']} {player_data['last_name']}")
                        for key, value in player_data.items():
                            setattr(existing_player, key, value)
                        existing_player.updated_at = datetime.utcnow()
                    else:
                        print(f"Adding new player: {player_data['first_name']} {player_data['last_name']}")
                        new_player = Player(**player_data)
                        db.session.add(new_player)
                        
                    db.session.commit()
                
                except Exception as e:
                    print(f"Error saving player {player_data['first_name']} {player_data['last_name']}: {e}")
                    db.session.rollback()
                    continue

            print("Successfully updated database")
            
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
    except Exception as e:
        print(f"General error: {e}")

if __name__ == "__main__":
    scrape_and_store()