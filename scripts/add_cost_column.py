import sqlite3

def add_column():
    conn = sqlite3.connect('../backend/sql_app_v2.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE content ADD COLUMN cost INTEGER DEFAULT 1 NOT NULL")
        print("Column 'cost' added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_column()
