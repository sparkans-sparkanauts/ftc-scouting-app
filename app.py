import sqlite3
import requests
import time
import os
import json
from flask import Flask, render_template, request, redirect, jsonify, url_for
from threading import Thread
from concurrent.futures import ThreadPoolExecutor
from werkzeug.utils import secure_filename

# Replace with your actual API Key
HACK_CLUB_API_KEY = """""

app = Flask(__name__)

# --- CONFIGURATION ---
CONFIG = {
    "EVENT_CODE": "CAABNILT1",
    "SEASON": "2025",  # Defaulting to 2025 as requested
    "SYNC_INTERVAL": 300,
    "UPLOAD_FOLDER": 'static/uploads'
}
app.config['UPLOAD_FOLDER'] = CONFIG['UPLOAD_FOLDER']
import json

@app.template_filter('from_json')
def from_json_filter(s):
    try:
        return json.loads(s)
    except:
        return {}

# Register the filter with Jinja
app.jinja_env.filters['from_json'] = from_json_filter
# Ensure upload directory exists
if not os.path.exists(CONFIG['UPLOAD_FOLDER']):
    os.makedirs(CONFIG['UPLOAD_FOLDER'])

# --- DATABASE HELPERS ---
def get_db_connection():
    conn = sqlite3.connect('scouting.db')
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;") # Enables high-speed concurrent access
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Teams: Stats + Bio + Photo
    c.execute('''CREATE TABLE IF NOT EXISTS teams 
                 (number TEXT PRIMARY KEY, name TEXT, opr REAL, 
                  city TEXT, state TEXT, country TEXT, rookie_year INTEGER, photo_path TEXT)''')
    # Matches: Full Alliance Schedule
    c.execute('''CREATE TABLE IF NOT EXISTS matches 
             (match_num INTEGER PRIMARY KEY, 
              red1 TEXT, red2 TEXT, blue1 TEXT, blue2 TEXT, 
              red_score INTEGER, blue_score INTEGER, completed BOOLEAN)''')
    # Interviews: 25 Yes/No Questions + Notes
    c.execute('''CREATE TABLE IF NOT EXISTS interviews 
                 (team_num TEXT PRIMARY KEY, answers TEXT, notes TEXT)''')
    # Notebook: Stylus Base64 Drawings
    c.execute('''CREATE TABLE IF NOT EXISTS drawings 
                 (team_num TEXT PRIMARY KEY, image_data TEXT)''')
    conn.commit()
    conn.close()
    print("📂 Database Initialized and WAL Mode Enabled.")

# --- FAST PARALLEL SYNC LOGIC ---

def fetch_team_details(num):
    """Worker to grab bio info for a specific team."""
    try:
        res = requests.get(f"https://api.ftcscout.org/rest/v1/teams/{num}", timeout=5)
        if res.status_code == 200:
            return res.json()
    except:
        return None


def perform_rest_sync():
    """
    Synchronizes local SQLite database with FTCScout REST API.
    Handles 2025 nested JSON scores and prevents duplicate match entries.
    """
    start_time = time.time()
    base_url = "https://api.ftcscout.org/rest/v1"
    season, event = CONFIG['SEASON'], CONFIG['EVENT_CODE']
    
    print(f"\n🔄 SYNC START: {event} ({season})")
    
    try:
        conn = get_db_connection()
        
        # --- 1. SYNC TEAMS & OPR ---
        print(f"📡 Fetching team list for {event}...")
        t_res = requests.get(f"{base_url}/events/{season}/{event}/teams", timeout=10)
        
        if t_res.status_code == 200 and t_res.json():
            participations = t_res.json()
            teams_needing_bio = []
            
            for part in participations:
                if not part: continue
                num = str(part.get('teamNumber', ''))
                
                # Extract OPR (Handles float or 2025 dict format)
                stats = part.get('stats') or {}
                opr_val = stats.get('opr', 0)
                if isinstance(opr_val, dict):
                    opr_val = opr_val.get('value', 0)
                
                # Update OPR immediately
                conn.execute('''INSERT INTO teams (number, opr) VALUES (?, ?) 
                                ON CONFLICT(number) DO UPDATE SET opr=excluded.opr''', 
                             (num, float(opr_val or 0)))
                
                # Check if we need to fetch the Name/City (Bio)
                existing = conn.execute('SELECT name FROM teams WHERE number = ?', (num,)).fetchone()
                if not existing or not existing['name'] or "Team" in existing['name']:
                    teams_needing_bio.append(num)

            # Parallel Fetching for Bio Data
            if teams_needing_bio:
                print(f"⚡ Parallel fetching bio for {len(teams_needing_bio)} teams...")
                with ThreadPoolExecutor(max_workers=5) as executor:
                    results = list(executor.map(fetch_team_details, teams_needing_bio))
                
                for t_data in results:
                    if t_data and isinstance(t_data, dict):
                        t_num = str(t_data.get('number', ''))
                        conn.execute('''UPDATE teams SET name=?, city=?, state=?, country=?, rookie_year=? 
                                        WHERE number=?''', 
                                     (t_data.get('name'), t_data.get('city'), t_data.get('state'), 
                                      t_data.get('country'), t_data.get('rookieYear'), t_num))

        # --- 2. SYNC MATCHES & SCORES ---
        print(f"📡 Fetching match schedule...")
        m_res = requests.get(f"{base_url}/events/{season}/{event}/matches", timeout=10)
        
        if m_res.status_code == 200 and m_res.json():
            matches = m_res.json()
            
            # CRITICAL: Clean up unplayed matches to prevent duplicates if the schedule changed
            conn.execute('DELETE FROM matches WHERE completed = 0')

            for m in matches:
                if not m: continue
                
                # Force ID to integer to prevent "ghost" duplicates
                m_num = int(m.get('matchNumber', 0))
                if m_num == 0: continue

                # Helper to handle 2025 score objects vs simple ints
                def get_total_score(side_data):
                    if isinstance(side_data, dict):
                        return side_data.get('total', side_data.get('amount', 0))
                    return side_data or 0

                scores_raw = m.get('scores') or {}
                r_score = int(get_total_score(scores_raw.get('red')))
                b_score = int(get_total_score(scores_raw.get('blue')))
                
                # Match is completed if a real score exists
                is_done = (r_score > 0 or b_score > 0)

                # Map stations to team numbers
                teams_list = m.get('teams') or []
                t_map = {t.get('station'): str(t.get('teamNumber', '')) for t in teams_list if t}
                
                conn.execute('''INSERT OR REPLACE INTO matches 
                                (match_num, red1, red2, blue1, blue2, red_score, blue_score, completed) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                             (m_num, 
                              t_map.get('Red1', ''), t_map.get('Red2', ''), 
                              t_map.get('Blue1', ''), t_map.get('Blue2', ''), 
                              r_score, b_score, is_done))
            
            print(f"✅ {len(matches)} matches synced successfully.")

        conn.commit()
        conn.close()
        print(f"🏁 SYNC FINISHED in {round(time.time() - start_time, 2)}s\n")
        return True

    except Exception as e:
        print(f"❌ CRITICAL SYNC ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
# --- BACKGROUND THREAD ---
def bg_thread():
    while True:
        perform_rest_sync()
        time.sleep(int(CONFIG['SYNC_INTERVAL']))

Thread(target=bg_thread, daemon=True).start()

# --- ALL ENDPOINTS ---

@app.route('/')
def dashboard():
    conn = get_db_connection()
    top_opr = conn.execute('SELECT * FROM teams ORDER BY opr DESC LIMIT 8').fetchall()
    next_matches = conn.execute('SELECT * FROM matches WHERE completed = 0 ORDER BY match_num ASC LIMIT 5').fetchall()
    conn.close()
    return render_template('index.html', teams=top_opr, matches=next_matches, config=CONFIG)

@app.route('/directory')
def directory():
    conn = get_db_connection()
    teams = conn.execute('SELECT * FROM teams ORDER BY CAST(number AS INTEGER)').fetchall()
    conn.close()
    return render_template('directory.html', teams=teams)

@app.route('/schedule')
def schedule():
    conn = get_db_connection()
    matches = conn.execute('SELECT * FROM matches ORDER BY match_num ASC').fetchall()
    conn.close()
    return render_template('schedule.html', matches=matches)

@app.route('/team/<number>')
def team_profile(number):
    conn = get_db_connection()
    team = conn.execute('SELECT * FROM teams WHERE number = ?', (number,)).fetchone()
    interview = conn.execute('SELECT * FROM interviews WHERE team_num = ?', (number,)).fetchone()
    drawing = conn.execute('SELECT * FROM drawings WHERE team_num = ?', (number,)).fetchone()
    conn.close()
    # If team isn't in DB yet (sync hasn't hit it), show dummy data
    if not team: return "Team not found. Try syncing again.", 404
    return render_template('team_page.html', team=team, interview=interview, drawing=drawing)

@app.route('/save_interview', methods=['POST'])
def save_interview():
    num = request.form.get('team_num')
    notes = request.form.get('notes')
    
    # Capture all 25 questions into a dictionary
    interview_data = {}
    for i in range(1, 26):
        q_text = request.form.get(f'q{i}_text')
        a_val = request.form.get(f'q{i}', 'No') # Default to No if unchecked
        interview_data[q_text] = a_val
    
    # Store as a JSON string
    json_answers = json.dumps(interview_data)
    
    conn = get_db_connection()
    conn.execute('REPLACE INTO interviews (team_num, answers, notes) VALUES (?, ?, ?)', 
                 (num, json_answers, notes))
    conn.commit()
    conn.close()
    return redirect(url_for('team_profile', number=num))

@app.route('/upload_photo', methods=['POST'])
def upload_photo():
    num = request.form.get('team_num')
    file = request.files.get('photo')
    if file and file.filename != '':
        filename = secure_filename(f"bot_{num}.png")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        conn = get_db_connection()
        conn.execute('UPDATE teams SET photo_path = ? WHERE number = ?', (filename, num))
        conn.commit()
        conn.close()
    return redirect(url_for('team_profile', number=num))

@app.route('/save_drawing', methods=['POST'])
def save_drawing():
    data = request.json
    conn = get_db_connection()
    conn.execute('REPLACE INTO drawings (team_num, image_data) VALUES (?, ?)', (data['team_num'], data['image']))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        CONFIG['EVENT_CODE'] = request.form.get('event_code')
        CONFIG['SEASON'] = request.form.get('season')
        print(f"⚙️ Admin updated settings: {CONFIG['EVENT_CODE']} | {CONFIG['SEASON']}")
        perform_rest_sync() # Immediate sync on save
        return redirect(url_for('dashboard'))
    return render_template('admin.html', config=CONFIG)

@app.route('/sync')
def manual_sync():
    success = perform_rest_sync()
    return redirect(url_for('dashboard'))

@app.route('/export')
def export_data():
    conn = get_db_connection()
    try:
        data = {
            "teams": [dict(r) for r in conn.execute('SELECT * FROM teams').fetchall()],
            "interviews": [dict(r) for r in conn.execute('SELECT * FROM interviews').fetchall()],
            # FIXED: Removed the extra 'VALUES' keyword
            "matches": [dict(r) for r in conn.execute('SELECT * FROM matches').fetchall()]
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
@app.route('/strategist', methods=['GET', 'POST'])
def strategist():
    response_text = ""
    user_query = ""
    
    if request.method == 'POST':
        user_query = request.form.get('query')
        
        # 1. Get all data from the database
        conn = get_db_connection()
        teams = [dict(r) for r in conn.execute('SELECT * FROM teams').fetchall()]
        interviews = [dict(r) for r in conn.execute('SELECT * FROM interviews').fetchall()]
        matches = [dict(r) for r in conn.execute('SELECT * FROM matches').fetchall()]
        conn.close()
        
        # 2. Prepare the data context for the AI
        context = {
            "team_stats": teams,
            "scouting_reports": interviews,
            "recent_matches": matches
        }
        
        # 3. Call the Hack Club AI Proxy
        try:
            headers = {
                "Authorization": f"Bearer {HACK_CLUB_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "qwen/qwen-2-5-72b-instruct", # Using a high-reasoning Qwen model
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a professional FIRST Tech Challenge (FTC) strategy coach. You are provided with scouting data in JSON format. Use this data to help the user plan for alliance selection and match strategy. Be concise and prioritize OPR and consistent auto performance."
                    },
                    {
                        "role": "user", 
                        "content": f"Context Data: {json.dumps(context)}\n\nUser Question: {user_query}"
                    }
                ]
            }
            
            res = requests.post("https://ai.hackclub.com/proxy/v1/chat/completions", 
                                headers=headers, json=payload, timeout=30)
            
            if res.status_code == 200:
                response_text = res.json()['choices'][0]['message']['content']
            else:
                response_text = f"Error from AI: {res.text}"
                
        except Exception as e:
            response_text = f"System Error: {str(e)}"

    return render_template('strategist.html', response=response_text, query=user_query)
if __name__ == '__main__':
    init_db()
    # Running on 0.0.0.0 so tablets/phones on the same Wi-Fi can connect
    app.run(debug=False, host='0.0.0.0', port=5000)