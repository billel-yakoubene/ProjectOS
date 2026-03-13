import sqlite3
import os

db_path = r'C:\Users\bille\.n8n\database.sqlite'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# List tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in cursor.fetchall()]

for table in tables:
    print(f"\nTable: {table}")
    cursor.execute(f"PRAGMA table_info({table});")
    columns = [c[1] for c in cursor.fetchall()]
    print(f"Columns: {columns}")
    
    if table == 'user':
        cursor.execute("SELECT * FROM user;")
        rows = cursor.fetchall()
        for row in rows:
            print("User row:", dict(row))

conn.close()


