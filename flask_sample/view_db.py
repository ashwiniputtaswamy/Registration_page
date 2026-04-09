import sqlite3

# Connect to your database
conn = sqlite3.connect('users.db')
cursor = conn.cursor()

# View all users
cursor.execute("SELECT id, username, email, created_at FROM users")
users = cursor.fetchall()

print("\n📊 Registered Users:")
print("-" * 60)
for user in users:
    print(f"ID: {user[0]} | Username: {user[1]} | Email: {user[2]} | Created: {user[3]}")
print("-" * 60)

conn.close()