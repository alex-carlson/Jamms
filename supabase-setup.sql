-- Create popular_jamms table in your Supabase database
-- Run this SQL in the Supabase SQL Editor

CREATE TABLE popular_jamms (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  plays INTEGER DEFAULT 0,
  youtube_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_plays table to track playlist usage
CREATE TABLE playlist_plays (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  youtube_url TEXT NOT NULL,
  playlist_id VARCHAR(100) NOT NULL,
  playlist_title TEXT,
  playlist_author TEXT,
  plays INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_playlist_plays_updated_at BEFORE UPDATE
ON playlist_plays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indices for popular_jamms
CREATE INDEX idx_popular_jamms_plays ON popular_jamms(plays DESC);
CREATE UNIQUE INDEX idx_popular_jamms_youtube_id ON popular_jamms(youtube_id);

-- Create indices for playlist_plays
CREATE INDEX idx_playlist_plays_plays ON playlist_plays(plays DESC);
CREATE UNIQUE INDEX idx_playlist_plays_youtube_url ON playlist_plays(youtube_url);
CREATE INDEX idx_playlist_plays_playlist_id ON playlist_plays(playlist_id);

-- Insert sample data
INSERT INTO popular_jamms (title, artist, genre, plays, youtube_id) VALUES
('Mr. Brightside', 'The Killers', 'Pop Punk', 250000, 'gGdGFtwCNBE'),
('Sugar, We''re Goin Down', 'Fall Out Boy', 'Pop Punk', 180000, 'uhG-vLZrb-g'),
('I''m Not Okay (I Promise)', 'My Chemical Romance', 'Pop Punk', 165000, 'dhZTNgAs4Fc'),
('All the Small Things', 'blink-182', 'Pop Punk', 140000, '9Ht5RZpzPqw'),
('Basket Case', 'Green Day', 'Pop Punk', 135000, 'NUTGr5t3MoY'),
('Misery Business', 'Paramore', 'Pop Punk', 120000, 'aCyGvGEtOwc');

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE popular_jamms ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_plays ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access to everyone
CREATE POLICY "Allow public read access" ON popular_jamms
FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON playlist_plays
FOR SELECT USING (true);

-- Allow anyone to insert/update playlist plays (for tracking usage)
CREATE POLICY "Allow public insert" ON playlist_plays
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON playlist_plays
FOR UPDATE USING (true);

-- If you want to allow authenticated users to insert/update:
-- CREATE POLICY "Allow authenticated insert" ON popular_jamms
-- FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated update" ON popular_jamms
-- FOR UPDATE USING (auth.role() = 'authenticated');

-- Migration for existing databases
ALTER TABLE playlist_plays ADD COLUMN IF NOT EXISTS playlist_title TEXT;
ALTER TABLE playlist_plays ADD COLUMN IF NOT EXISTS playlist_author TEXT;