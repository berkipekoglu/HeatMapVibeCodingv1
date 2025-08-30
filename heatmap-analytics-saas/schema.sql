-- Users Table: Stores user account information.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- In a real app, never store plain text passwords.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Websites Table: Stores websites registered by users to be tracked.
CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Click Events Table: Stores individual click events from the tracker.
-- This table can grow very large, so partitioning might be considered in the future.
CREATE TABLE click_events (
    id BIGSERIAL PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    x INT NOT NULL,
    y INT NOT NULL,
    viewport_width INT NOT NULL, -- New column
    viewport_height INT NOT NULL, -- New column
    url VARCHAR(2048) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Mouse Move Events Table: Stores batches of mouse movement coordinates.
-- Using JSONB to store an array of points [{x, y}, {x, y}, ...]
CREATE TABLE mousemove_events (
    id BIGSERIAL PRIMARY KEY,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    points JSONB NOT NULL,
    url VARCHAR(2048) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_click_events_website_id ON click_events(website_id);
CREATE INDEX idx_click_events_timestamp ON click_events(timestamp);
CREATE INDEX idx_mousemove_events_website_id ON mousemove_events(website_id);
CREATE INDEX idx_mousemove_events_timestamp ON mousemove_events(timestamp);