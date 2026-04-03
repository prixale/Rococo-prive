/**
 * Database Schema Proposal for Rococo Prive (PostgreSQL)
 * This schema replaces the current localStorage implementation.
 */

/*
-- TABLE: user_accounts
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'user', 'model', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: model_profiles
CREATE TABLE model_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_accounts(id),
    name TEXT NOT NULL,
    location TEXT,
    age INT,
    height INT,
    price_clp INT,
    category TEXT, -- 'Nuevas', 'Verificadas', 'Elite'
    description TEXT,
    phone TEXT,
    whatsapp TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: media
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES model_profiles(id),
    type TEXT, -- 'photo', 'video', 'story'
    url TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- For stories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_accounts(id),
    plan TEXT NOT NULL,
    amount INT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'pending', 'failure'
    external_ref TEXT UNIQUE, -- Mercado Pago / Webpay ref
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

export const databaseOverview = "Este esquema permitiría migrar toda la data de localStorage a una base de datos relacional, " + 
  "asegurando la persistencia multi-dispositivo y la escalabilidad del proyecto.";
