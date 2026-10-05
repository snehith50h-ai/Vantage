import os
import psycopg2
from pgvector.psycopg2 import register_vector
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection(register=True):
    conn = psycopg2.connect(DATABASE_URL)
    if register:
        try:
            register_vector(conn)
        except psycopg2.ProgrammingError:
            pass # Extension might not be created yet
    return conn

def init_db():
    conn = get_db_connection(register=False)
    cur = conn.cursor()
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS challenges (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            organizer VARCHAR(255),
            description TEXT,
            rubric_json JSONB,
            rules_json JSONB,
            tracks_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            capabilities_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id),
            challenge_id INTEGER REFERENCES challenges(id),
            project_name VARCHAR(255),
            description TEXT,
            contract_json JSONB,
            scope_json JSONB,
            architecture_json JSONB,
            tasks_json JSONB,
            xray_json JSONB,
            github_repo VARCHAR(255),
            repo_state_json JSONB,
            embedding vector(3072),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
