import sqlite3
import os

def upgrade():
    db_path = 'sql_app_v2.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Creating social_posts table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS social_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content_id INTEGER,
                platform TEXT NOT NULL,
                caption TEXT NOT NULL,
                image_url TEXT,
                status TEXT NOT NULL DEFAULT 'Draft',
                scheduled_at DATETIME,
                published_at DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (content_id) REFERENCES content (id)
            )
        ''')
        conn.commit()
        print("Table social_posts created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade()
