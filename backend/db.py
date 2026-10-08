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

    # ---------- Per-user accounts & data ----------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(320) UNIQUE NOT NULL,
            password_hash TEXT,
            name VARCHAR(255),
            avatar_url TEXT,
            google_sub VARCHAR(255) UNIQUE,
            created_at TIMESTAMPTZ DEFAULT now(),
            last_login_at TIMESTAMPTZ
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            default_model VARCHAR(100) DEFAULT 'gemini-3.5-flash-lite',
            temperature REAL DEFAULT 0.7,
            system_instruction TEXT,
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    """)

    # Chat-style history of AI Studio Playground runs
    cur.execute("""
        CREATE TABLE IF NOT EXISTS playground_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255),
            organizer_name VARCHAR(255),
            problem_statement TEXT,
            config_json JSONB,
            result_json JSONB,
            pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_runs_user ON playground_runs(user_id, updated_at DESC);")

    # Saved outputs from the other tools (scope, execution, xray, postmortem, team, mentor, github)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS saved_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            kind VARCHAR(50) NOT NULL,
            title VARCHAR(255),
            input_json JSONB,
            output_json JSONB,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_items_user ON saved_items(user_id, kind, created_at DESC);")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS usage_events (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint VARCHAR(255),
            model VARCHAR(100),
            input_tokens INTEGER DEFAULT 0,
            output_tokens INTEGER DEFAULT 0,
            latency_ms INTEGER DEFAULT 0,
            status_code INTEGER,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_events(user_id, created_at DESC);")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(128) UNIQUE NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);")

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
