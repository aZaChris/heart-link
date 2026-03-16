-- HeartLink Supabase Schema

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    code TEXT UNIQUE NOT NULL, -- Unique partner linking code
    partner_id UUID REFERENCES users(id),
    fcm_token TEXT, -- Firebase Cloud Messaging token for push notifications
    total_scans INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_scan_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scans history table
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    tag_uid TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to safely increment scans and manage streaks
CREATE OR REPLACE FUNCTION increment_scans(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_last_scan_date DATE;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get current user stats
    SELECT last_scan_date INTO v_last_scan_date
    FROM users
    WHERE id = p_user_id;

    -- Update logic
    IF v_last_scan_date IS NULL OR v_last_scan_date < v_today - INTERVAL '1 day' THEN
        -- Streak broken or first scan ever
        UPDATE users
        SET total_scans = total_scans + 1,
            current_streak = 1,
            last_scan_date = v_today
        WHERE id = p_user_id;
    ELSIF v_last_scan_date = v_today - INTERVAL '1 day' THEN
        -- Streak continues
        UPDATE users
        SET total_scans = total_scans + 1,
            current_streak = current_streak + 1,
            last_scan_date = v_today
        WHERE id = p_user_id;
    ELSIF v_last_scan_date = v_today THEN
        -- Already scanned today, just increment total
        UPDATE users
        SET total_scans = total_scans + 1
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies (Example basic setup)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and their partner's data
CREATE POLICY "Users can view own and partner data" ON users
    FOR SELECT
    USING (auth.uid() = id OR auth.uid() = partner_id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" ON scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can read their own scans and their partner's scans
CREATE POLICY "Users can view own and partner scans" ON scans
    FOR SELECT
    USING (
         auth.uid() = user_id OR 
         auth.uid() IN (SELECT partner_id FROM users WHERE id = scans.user_id)
    );
