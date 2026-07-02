import sqlite3
import os

def create_table():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/sql_app_v2.db'))
    print(f"Connecting to DB at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Enable JSON support check (SQLite usually has it by default now)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_id INTEGER NOT NULL UNIQUE,
            readability_score INTEGER NOT NULL,
            seo_score INTEGER NOT NULL,
            sentiment_label VARCHAR NOT NULL,
            critique VARCHAR,
            suggestions JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY(content_id) REFERENCES content(id)
        );
        """)
        print("Table 'content_scores' created successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_table()
