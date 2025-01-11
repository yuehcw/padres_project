# Baseball Stats Application

A full-stack web application for viewing baseball statistics using Flask, React, and PostgreSQL.

## Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.8 or higher
- Node.js 14 or higher
- PostgreSQL 13 or higher
- pip (Python package manager)
- npm (Node package manager)

## Quick Start Guide

### 1. Clone the Repository
```bash
git clone [your-repository-url]
cd [repository-name]
```

### 2. Database Setup

#### First-time PostgreSQL Setup:
1. Download and Install PostgreSQL:
   - Visit [PostgreSQL Downloads](https://www.postgresql.org/download/)
   - Choose your operating system and follow installation instructions
   - During installation, note down the port number (default is 5432)

2. Create Database and User:
   ```sql
   # Connect to PostgreSQL
   psql -U postgres

   -- Once in psql shell:
   CREATE DATABASE padres_project;

   -- Optional: If you want to create a new user
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE padres_project TO your_username;

   -- Connect to the database
   \c padres_project

   -- Now proceed with schema setup
   ```

### 3. Database Schema Setup
```sql
-- Make sure you're connected to padres_project database
-- Run these commands while still in psql:

-- Create player_bio table
CREATE TABLE player_bio (
    ...


-- Once inside psql shell:
CREATE DATABASE padres_project;

-- Optional: If you want to create a new user
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE padres_project TO your_username;

-- Connect to the newly created database
\c padres_project

-- Now create the tables (still inside psql):

-- Create player_bio table
CREATE TABLE player_bio (
    player_id SERIAL PRIMARY KEY,
    bam_id INTEGER,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER,
    height FLOAT,
    weight FLOAT,
    position VARCHAR(50),
    birth_place VARCHAR(100),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pitching_info table
CREATE TABLE pitching_info (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES player_bio(player_id) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    game_date DATE,
    game_bam_id INTEGER,
    at_bat_number INTEGER,
    inning INTEGER,
    pitch_seq INTEGER,
    pitch_type VARCHAR(50),
    horz_break FLOAT,
    induced_vert_break FLOAT,
    rel_speed FLOAT,
    pre_outs INTEGER,
    post_outs INTEGER,
    pre_vscore INTEGER,
    post_vscore INTEGER,
    pre_balls INTEGER,
    pre_strikes INTEGER,
    post_balls INTEGER,
    post_strikes INTEGER,
    event_type VARCHAR(100),
    description TEXT,
    spin_rate FLOAT,
    spin_axis FLOAT,
    zone_speed FLOAT,
    plate_x FLOAT,
    plate_z FLOAT,
    extension FLOAT,
    tilt VARCHAR(50),
    hit_exit_speed FLOAT,
    hit_distance FLOAT,
    hit_vertical_angle FLOAT,
    hit_horizontal_angle FLOAT,
    in_play BOOLEAN,
    hit_trajectory VARCHAR(50)
);

-- Create batting_info table
CREATE TABLE batting_info (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES player_bio(player_id) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    game_date DATE,
    game_bam_id INTEGER,
    at_bat_number INTEGER,
    inning INTEGER,
    pitch_seq INTEGER,
    event_type VARCHAR(100),
    description TEXT,
    hit_trajectory VARCHAR(50),
    hit_exit_speed FLOAT,
    hit_vertical_angle FLOAT,
    hit_horizontal_angle FLOAT,
    hit_distance FLOAT,
    hit_bearing FLOAT,
    pre_balls INTEGER,
    pre_strikes INTEGER,
    post_balls INTEGER,
    post_strikes INTEGER,
    pre_vscore INTEGER,
    post_vscore INTEGER,
    pre_basecode INTEGER,
    post_basecode INTEGER,
    pre_r1_bam_id INTEGER,
    pre_r2_bam_id INTEGER,
    pre_r3_bam_id INTEGER,
    post_r1_bam_id INTEGER,
    post_r2_bam_id INTEGER,
    post_r3_bam_id INTEGER,
    swing BOOLEAN,
    contact BOOLEAN,
    in_play BOOLEAN,
    pitch_type VARCHAR(50),
    plate_x FLOAT,
    plate_z FLOAT,
    called_strike BOOLEAN,
    swinging_strike BOOLEAN,
    chase BOOLEAN,
    ball BOOLEAN
);

-- Verify tables were created
\dt

-- Exit psql
\q
```

After setting up the database schema, proceed with the Python scripts to load the data.

4. Create Your Database and Set Up Schema:
   ```sql
   -- Once in psql shell:
   CREATE DATABASE padres_project;
   
   -- Optional: If you want to create a new user
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE padres_project TO your_username;
   
   -- Connect to the database
   \c padres_project

   -- Run the table creation scripts (see step 3)

   \q  -- to quit psql
   ```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a new .env file in the root of the backend folder
touch backend/.env  # On macOS/Linux
# OR
type nul > backend/.env  # On Windows

# Load data into database
# Navigate to utils directory
cd utils

# Run the data loading scripts in this specific order:
python load_players_info.py
python load_pitching_info.py
python load_batting_info.py

# Start Flask server
flask run
```

### 4. Frontend Setup
```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Create .env file in frontend root directory
touch .env  # On macOS/Linux
# OR
type nul > .env  # On Windows

# Add the following content to frontend/.env
VITE_PROXY_URL=http://127.0.0.1:5000  # Points to Flask backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173` (default Vite port)

Note about ports:
- Frontend (Vite) runs on port 5173 by default
- Backend (Flask) runs on port 5000 by default
- If you need to use different ports:
  1. For backend: Set `FLASK_RUN_PORT=your_port` in backend/.env
  2. For frontend: Set `VITE_PORT=your_port` in frontend/.env

## Project Structure
```
├── backend/
│   ├── app/              # Main Flask application
│   ├── data/             # CSV data files
│   │   ├── padres_project_data.csv
│   │   └── player_info.csv
│   ├── utils/           # Data loading scripts
│   │   ├── load_players_info.py
│   │   ├── load_pitching_info.py
│   │   └── load_batting_info.py
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/            # React source code
│   ├── public/         # Static files
│   └── package.json    # Node.js dependencies
└── README.md
```

## Troubleshooting

#### Common PostgreSQL Issues:

1. **"psql: command not found"**
   - Make sure PostgreSQL is installed
   - Add PostgreSQL to your system PATH
     - Windows: Usually `C:\Program Files\PostgreSQL\{version}\bin`
     - macOS: If installed via Homebrew, run `brew link postgresql`
     - Linux: Should be added automatically during installation

2. **"could not connect to server"**
   - Check if PostgreSQL service is running:
     - Windows: Check Services app
     - macOS: Run `brew services start postgresql`
     - Linux: Run `sudo service postgresql start`

3. **"peer authentication failed"**
   - Edit pg_hba.conf to change authentication method
   - Location:
     - Windows: `C:\Program Files\PostgreSQL\{version}\data\pg_hba.conf`
     - macOS: `/usr/local/var/postgres/pg_hba.conf`
     - Linux: `/etc/postgresql/{version}/main/pg_hba.conf`

## Data Loading

The project requires loading data from CSV files into the database. The data must be loaded in a specific order:

1. First, run `load_players_info.py` to load basic player information
2. Then, run `load_pitching_info.py` to load pitching statistics
3. Finally, run `load_batting_info.py` to load batting statistics

These scripts are located in the `backend/utils` directory. The order is important because later scripts depend on the data loaded by earlier ones.

Required CSV files in `backend/data`:
- padres_project_data.csv
- player_info.csv

## Support

For additional help or to report issues, please create a new issue in the project repository.

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

[Your chosen license]