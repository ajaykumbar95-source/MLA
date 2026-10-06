-- Khanapur MLA Portal - PostgreSQL Schema
-- Run this file to initialize the database:
--   psql -U postgres -d khanapur_mla -f schema.sql

CREATE DATABASE khanapur_mla;
\c khanapur_mla;

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  mla_name TEXT,
  designation TEXT,
  constituency TEXT,
  party TEXT,
  photo_url TEXT,
  hero_message TEXT,
  official_quote TEXT,
  office_address TEXT,
  office_phone TEXT,
  office_email TEXT,
  office_hours TEXT,
  social JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  location TEXT,
  village TEXT,
  gram_panchayat TEXT,
  department TEXT,
  category TEXT,
  sanctioned_amount NUMERIC,
  estimated_amount NUMERIC,
  start_date DATE,
  expected_completion DATE,
  actual_completion DATE,
  status TEXT,
  progress INTEGER,
  year INTEGER,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  featured BOOLEAN DEFAULT FALSE,
  updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  slug TEXT,
  title TEXT,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  cover_image TEXT,
  author TEXT,
  featured BOOLEAN DEFAULT FALSE,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  date TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS schemes (
  id TEXT PRIMARY KEY,
  name TEXT,
  scope TEXT,
  department TEXT,
  description TEXT,
  eligibility TEXT,
  benefits TEXT,
  documents_required TEXT,
  application_process TEXT,
  official_link TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  image TEXT,
  date TIMESTAMPTZ,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  description TEXT,
  file_url TEXT,
  file_size TEXT,
  date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  name TEXT,
  gram_panchayat TEXT,
  taluk TEXT,
  population INTEGER,
  status TEXT,
  projects_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  password TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  mobile TEXT,
  password TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS citizen_requests (
  id TEXT PRIMARY KEY,
  tracking_id TEXT UNIQUE,
  type TEXT,
  name TEXT,
  mobile TEXT,
  email TEXT,
  user_id TEXT,
  user_email TEXT,
  address TEXT,
  village TEXT,
  gram_panchayat TEXT,
  category TEXT,
  description TEXT,
  attachment TEXT,
  status TEXT,
  assigned_to TEXT,
  internal_notes JSONB DEFAULT '[]'::jsonb,
  updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT,
  mobile TEXT,
  email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_village ON projects(village);
CREATE INDEX IF NOT EXISTS idx_projects_year ON projects(year);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_requests_status ON citizen_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_tracking ON citizen_requests(tracking_id);
CREATE INDEX IF NOT EXISTS idx_requests_created ON citizen_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery("order");
