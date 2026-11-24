"""Storage for shared project plans and their access grants."""


def init_delivery_schema(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS delivery_projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            source_run_id UUID UNIQUE REFERENCES playground_runs(id) ON DELETE SET NULL,
            document JSONB NOT NULL CHECK (jsonb_typeof(document) = 'object'),
            revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
            invite_digest TEXT UNIQUE,
            invite_expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CHECK ((invite_digest IS NULL) = (invite_expires_at IS NULL))
        );
        CREATE INDEX IF NOT EXISTS delivery_projects_owner_idx ON delivery_projects(owner_id);

        CREATE TABLE IF NOT EXISTS delivery_project_members (
            project_id UUID NOT NULL REFERENCES delivery_projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (project_id, user_id)
        );
        CREATE INDEX IF NOT EXISTS delivery_members_user_idx ON delivery_project_members(user_id, project_id);
    """)
