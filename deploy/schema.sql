CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    session_token VARCHAR(255),
    session_expires_at TIMESTAMPTZ,
    totp_secret VARCHAR(32),
    totp_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    jwt_secret VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    totp_secret VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heroes (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    rarity VARCHAR(32) NOT NULL DEFAULT 'common',
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    hp INTEGER NOT NULL DEFAULT 100,
    attack INTEGER NOT NULL DEFAULT 10,
    defense INTEGER NOT NULL DEFAULT 5,
    speed INTEGER NOT NULL DEFAULT 3,
    equipped_weapon_id INTEGER,
    equipped_armor_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rarity_config (
    rarity VARCHAR(32) PRIMARY KEY,
    drop_rate NUMERIC(5,4) NOT NULL,
    min_level INTEGER NOT NULL DEFAULT 1,
    hp_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    attack_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    defense_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    speed_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

INSERT INTO rarity_config (rarity, drop_rate, min_level, hp_multiplier, attack_multiplier, defense_multiplier, speed_multiplier) VALUES
    ('common', 0.5000, 1, 1.00, 1.00, 1.00, 1.00),
    ('uncommon', 0.2500, 1, 1.10, 1.10, 1.10, 1.05),
    ('rare', 0.1500, 5, 1.25, 1.25, 1.15, 1.10),
    ('epic', 0.0700, 10, 1.50, 1.50, 1.30, 1.15),
    ('legendary', 0.0250, 20, 2.00, 2.00, 1.60, 1.25),
    ('mythic', 0.0050, 40, 3.00, 3.00, 2.00, 1.50)
ON CONFLICT (rarity) DO NOTHING;

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    rarity VARCHAR(32) NOT NULL DEFAULT 'common',
    slot VARCHAR(32),
    stat_type VARCHAR(32),
    stat_value INTEGER DEFAULT 0,
    icon_path VARCHAR(255),
    craftable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_inventory (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    species VARCHAR(64) NOT NULL,
    rarity VARCHAR(32) NOT NULL DEFAULT 'common',
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    combat_power INTEGER NOT NULL DEFAULT 5,
    ability VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    element VARCHAR(32) NOT NULL,
    power INTEGER NOT NULL DEFAULT 1,
    effect VARCHAR(64),
    icon_path VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_runes (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    rune_id INTEGER NOT NULL REFERENCES runes(id),
    equipped_slots INTEGER[] DEFAULT '{}',
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crafting_recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    result_item_id INTEGER NOT NULL REFERENCES items(id),
    result_quantity INTEGER NOT NULL DEFAULT 1,
    material_item_ids INTEGER[] NOT NULL,
    material_quantities INTEGER[] NOT NULL,
    required_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waves (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    wave_number INTEGER NOT NULL,
    enemy_type VARCHAR(64) NOT NULL,
    enemy_count INTEGER NOT NULL DEFAULT 1,
    enemy_hp INTEGER NOT NULL DEFAULT 100,
    enemy_attack INTEGER NOT NULL DEFAULT 10,
    enemy_defense INTEGER NOT NULL DEFAULT 5,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    gold_reward INTEGER NOT NULL DEFAULT 5,
    drop_table JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combat_sessions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    hero_id INTEGER REFERENCES heroes(id) ON DELETE SET NULL,
    wave_id INTEGER REFERENCES waves(id) ON DELETE SET NULL,
    result VARCHAR(16) NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    gold_earned INTEGER NOT NULL DEFAULT 0,
    items_earned JSONB DEFAULT '[]',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heroes_player_id ON heroes(player_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_player_id ON player_inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_pets_player_id ON pets(player_id);
CREATE INDEX IF NOT EXISTS idx_player_runes_player_id ON player_runes(player_id);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_player_id ON combat_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_completed_at ON combat_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_waves_level ON waves(level);