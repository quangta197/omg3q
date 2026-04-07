CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    icon_url VARCHAR(1000),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    server_id UUID NOT NULL REFERENCES servers(id),
    nation_id UUID REFERENCES nations(id),
    power_score INT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    vip_level INT DEFAULT 0,
    price DECIMAL(15, 0) NOT NULL,
    installment_price DECIMAL(15, 0),
    original_price DECIMAL(15, 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'reserved', 'sold', 'hidden')),
    thumbnail_url VARCHAR(1000),
    highlights JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_sold BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE account_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    sort_order INT DEFAULT 0,
    caption VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE account_heroes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    hero_name VARCHAR(200) NOT NULL,
    star_level INT DEFAULT 1 CHECK (star_level BETWEEN 1 AND 15),
    awakening_level INT DEFAULT 0,
    hero_class VARCHAR(50),
    thumbnail_url VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_zalo VARCHAR(200),
    contact_method VARCHAR(20) DEFAULT 'zalo'
        CHECK (contact_method IN ('zalo', 'facebook', 'phone', 'form')),
    message TEXT,
    status VARCHAR(20) DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE TABLE site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_server ON accounts(server_id) WHERE status = 'available';
CREATE INDEX idx_accounts_nation ON accounts(nation_id) WHERE status = 'available';
CREATE INDEX idx_accounts_power ON accounts(power_score) WHERE status = 'available';
CREATE INDEX idx_accounts_price ON accounts(price) WHERE status = 'available';
CREATE INDEX idx_accounts_featured ON accounts(is_featured, created_at DESC) WHERE status = 'available';
CREATE INDEX idx_accounts_slug ON accounts(slug);
CREATE INDEX idx_accounts_filter_combo ON accounts(server_id, nation_id, power_score, price)
    WHERE status = 'available';
CREATE INDEX idx_account_images_account ON account_images(account_id, sort_order);
CREATE INDEX idx_account_heroes_account ON account_heroes(account_id);
CREATE INDEX idx_contact_requests_status ON contact_requests(status, created_at DESC);
CREATE INDEX idx_contact_requests_account ON contact_requests(account_id);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read accounts" ON accounts
    FOR SELECT USING (status IN ('available', 'reserved', 'sold'));

CREATE POLICY "Public read account_images" ON account_images
    FOR SELECT USING (true);

CREATE POLICY "Public read account_heroes" ON account_heroes
    FOR SELECT USING (true);

CREATE POLICY "Public read servers" ON servers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read nations" ON nations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public insert contact" ON contact_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read site_settings" ON site_settings
    FOR SELECT USING (true);
