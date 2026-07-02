import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'sql_app_v2.db'))

def upgrade():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Add generated_image_url
        cursor.execute("ALTER TABLE content ADD COLUMN generated_image_url VARCHAR")
        print("Added generated_image_url")
    except sqlite3.OperationalError as e:
        print(f"Skipping generated_image_url: {e}")

    try:
        # Add generation_type
        cursor.execute("ALTER TABLE content ADD COLUMN generation_type VARCHAR DEFAULT 'text'")
        print("Added generation_type")
    except sqlite3.OperationalError as e:
        print(f"Skipping generation_type: {e}")

    try:
        # Add platform
        cursor.execute("ALTER TABLE content ADD COLUMN platform VARCHAR")
        print("Added platform")
    except sqlite3.OperationalError as e:
        print(f"Skipping platform: {e}")

    try:
        # Add tone
        cursor.execute("ALTER TABLE content ADD COLUMN tone VARCHAR")
        print("Added tone")
    except sqlite3.OperationalError as e:
        print(f"Skipping tone: {e}")

    # Also need to make generated_text and content_type nullable? SQLite doesn't support ALTER COLUMN.
    # But it's fine since we can just insert empty strings or NULL if sqlite allows it dynamically or we just supply empty strings.
    # We will supply empty strings from backend if needed.

    conn.commit()
    conn.close()
    print("Upgrade complete.")

if __name__ == "__main__":
    upgrade()
