-- Clean migration that handles existing objects
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

DROP POLICY IF EXISTS "Users can view own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON scenarios;

DROP POLICY IF EXISTS "Users can view runs for own scenarios" ON runs;
DROP POLICY IF EXISTS "Users can insert runs for own scenarios" ON runs;
DROP POLICY IF EXISTS "Users can update runs for own scenarios" ON runs;
DROP POLICY IF EXISTS "Users can delete runs for own scenarios" ON runs;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenarios table (if not exists)
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    salary DECIMAL(12,2) NOT NULL,
    expenses_json JSONB NOT NULL DEFAULT '{}',
    city VARCHAR(255) NOT NULL
);

-- Create runs table (if not exists)
CREATE TABLE IF NOT EXISTS runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    weights_json JSONB NOT NULL DEFAULT '{}',
    metrics_json JSONB NOT NULL DEFAULT '{}'
);

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_scenario_id ON runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for scenarios table
CREATE POLICY "Users can view own scenarios" ON scenarios
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Users can insert own scenarios" ON scenarios
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Users can update own scenarios" ON scenarios
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Users can delete own scenarios" ON scenarios
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE auth.uid()::text = id::text
        )
    );

-- RLS Policies for runs table
CREATE POLICY "Users can view runs for own scenarios" ON runs
    FOR SELECT USING (
        scenario_id IN (
            SELECT s.id FROM scenarios s
            JOIN users u ON s.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

CREATE POLICY "Users can insert runs for own scenarios" ON runs
    FOR INSERT WITH CHECK (
        scenario_id IN (
            SELECT s.id FROM scenarios s
            JOIN users u ON s.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

CREATE POLICY "Users can update runs for own scenarios" ON runs
    FOR UPDATE USING (
        scenario_id IN (
            SELECT s.id FROM scenarios s
            JOIN users u ON s.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );

CREATE POLICY "Users can delete runs for own scenarios" ON runs
    FOR DELETE USING (
        scenario_id IN (
            SELECT s.id FROM scenarios s
            JOIN users u ON s.user_id = u.id
            WHERE auth.uid()::text = u.id::text
        )
    );
