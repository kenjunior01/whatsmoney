-- WhatsMoney Marketplace Database Schema Setup
-- This script creates all necessary tables for the marketplace

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS whatsmoney;

-- Users table (extends the existing neon_auth.users_sync)
CREATE TABLE IF NOT EXISTS whatsmoney.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('user', 'company', 'admin')) DEFAULT 'user',
    avatar_url TEXT,
    phone TEXT,
    status TEXT CHECK (status IN ('active', 'suspended', 'banned')) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    affiliate_code TEXT UNIQUE,
    referred_by TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Host profiles for users who sell WhatsApp status space
CREATE TABLE IF NOT EXISTS whatsmoney.host_profiles (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    bio TEXT,
    niche TEXT,
    price_per_story DECIMAL(10,2),
    whatsapp_number TEXT,
    followers_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company profiles for advertisers
CREATE TABLE IF NOT EXISTS whatsmoney.company_profiles (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    industry TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshots uploaded by hosts
CREATE TABLE IF NOT EXISTS whatsmoney.screenshots (
    id SERIAL PRIMARY KEY,
    host_profile_id INTEGER REFERENCES whatsmoney.host_profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advertising campaigns created by companies
CREATE TABLE IF NOT EXISTS whatsmoney.campaigns (
    id SERIAL PRIMARY KEY,
    company_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    price_per_story DECIMAL(10,2),
    target_audience TEXT,
    niche TEXT,
    status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications from hosts to campaigns
CREATE TABLE IF NOT EXISTS whatsmoney.campaign_applications (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES whatsmoney.campaigns(id) ON DELETE CASCADE,
    host_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    message TEXT,
    proposed_price DECIMAL(10,2),
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat conversations between users
CREATE TABLE IF NOT EXISTS whatsmoney.conversations (
    id SERIAL PRIMARY KEY,
    user1_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    user2_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS whatsmoney.messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES whatsmoney.conversations(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text',
    image_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS whatsmoney.transactions (
    id SERIAL PRIMARY KEY,
    payer_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    payee_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES whatsmoney.campaigns(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    commission DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('paypal', 'bank_transfer', 'pix')) DEFAULT 'paypal',
    paypal_order_id TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS whatsmoney.reviews (
    id SERIAL PRIMARY KEY,
    reviewer_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    reviewed_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES whatsmoney.campaigns(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports for content moderation
CREATE TABLE IF NOT EXISTS whatsmoney.reports (
    id SERIAL PRIMARY KEY,
    reporter_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    reported_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    report_type TEXT CHECK (report_type IN ('spam', 'inappropriate', 'fraud', 'other')),
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS whatsmoney.notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES whatsmoney.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('message', 'payment', 'campaign', 'system')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON whatsmoney.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON whatsmoney.users(role);
CREATE INDEX IF NOT EXISTS idx_host_profiles_user_id ON whatsmoney.host_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON whatsmoney.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON whatsmoney.campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON whatsmoney.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON whatsmoney.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON whatsmoney.transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON whatsmoney.transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON whatsmoney.notifications(user_id);

-- Insert some demo data
INSERT INTO whatsmoney.users (id, email, name, role, affiliate_code) VALUES
('demo-host-1', 'host1@example.com', 'Maria Silva', 'user', 'HOST001'),
('demo-host-2', 'host2@example.com', 'João Santos', 'user', 'HOST002'),
('demo-company-1', 'company1@example.com', 'TechCorp', 'company', 'COMP001'),
('demo-admin-1', 'admin@whatsmoney.com', 'Admin User', 'admin', 'ADMIN001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO whatsmoney.host_profiles (user_id, bio, niche, price_per_story, whatsapp_number, followers_count, engagement_rate, rating, total_reviews) VALUES
('demo-host-1', 'Influenciadora de moda e lifestyle', 'Fashion', 25.00, '+5511999999999', 15000, 8.5, 4.8, 24),
('demo-host-2', 'Creator de conteúdo tech', 'Technology', 30.00, '+5511888888888', 22000, 7.2, 4.6, 18)
ON CONFLICT DO NOTHING;

INSERT INTO whatsmoney.company_profiles (user_id, company_name, description, industry) VALUES
('demo-company-1', 'TechCorp Solutions', 'Empresa de tecnologia focada em soluções inovadoras', 'Technology')
ON CONFLICT DO NOTHING;

INSERT INTO whatsmoney.campaigns (company_id, title, description, budget, price_per_story, target_audience, niche, status) VALUES
('demo-company-1', 'Lançamento Novo App', 'Campanha para divulgar nosso novo aplicativo', 1000.00, 25.00, 'Jovens 18-35', 'Technology', 'active')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'WhatsMoney database schema created successfully!' as result;
