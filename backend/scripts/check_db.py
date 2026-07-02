import sqlite3

def check_db():
    try:
        conn = sqlite3.connect('sql_app_v2.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables in database:")
        for table in tables:
            print(f"- {table[0]}")
            
            # Check columns for social_posts
            if table[0] == 'social_posts':
                cursor.execute("PRAGMA table_info(social_posts);")
                columns = cursor.fetchall()
                print("  Columns in social_posts:")
                for col in columns:
                    print(f"    {col[1]} ({col[2]})")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
