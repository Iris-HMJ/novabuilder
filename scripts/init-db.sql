-- NovaBuilder Database Initialization Script
-- Creates platform and novadb schemas

-- Create platform schema (for metadata)
CREATE SCHEMA IF NOT EXISTS platform;

-- Create novadb schema (for user data)
CREATE SCHEMA IF NOT EXISTS novadb;

-- Create platform tables

-- Users table
CREATE TABLE IF NOT EXISTS platform.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'builder' CHECK (role IN ('admin', 'builder', 'end_user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS platform.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES platform.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apps table
CREATE TABLE IF NOT EXISTS platform.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    workspace_id UUID REFERENCES platform.workspaces(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    definition_draft JSONB,
    definition_published JSONB,
    definition_previous JSONB,
    created_by UUID REFERENCES platform.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- App pages table
CREATE TABLE IF NOT EXISTS platform.app_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES platform.apps(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    definition JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data sources table
CREATE TABLE IF NOT EXISTS platform.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES platform.workspaces(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config_encrypted JSONB,
    created_by UUID REFERENCES platform.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Queries table
CREATE TABLE IF NOT EXISTS platform.queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES platform.apps(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    data_source_id UUID REFERENCES platform.data_sources(id),
    type VARCHAR(50) NOT NULL,
    query_string TEXT,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON platform.users(email);
CREATE INDEX IF NOT EXISTS idx_apps_workspace ON platform.apps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_app_pages_app ON platform.app_pages(app_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_workspace ON platform.data_sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_queries_app ON platform.queries(app_id);

-- Create novadb tables (for user data)

-- NovaDB tables metadata
CREATE TABLE IF NOT EXISTS novadb.nova_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES platform.workspaces(id),
    table_name VARCHAR(100) NOT NULL,
    schema_definition JSONB,
    created_by UUID REFERENCES platform.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, table_name)
);

-- Grant permissions (for development)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA platform TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA novadb TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA platform TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA novadb TO postgres;

-- Create default workspace for development
INSERT INTO platform.workspaces (id, name, owner_id)
SELECT gen_random_uuid(), 'Default Workspace', id
FROM platform.users
WHERE NOT EXISTS (SELECT 1 FROM platform.workspaces)
LIMIT 1;

COMMENT ON SCHEMA platform IS 'Platform metadata: users, apps, datasources, queries';
COMMENT ON SCHEMA novadb IS 'User data: nova tables created by users';
