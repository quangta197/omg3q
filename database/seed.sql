INSERT INTO nations (name, code, sort_order) VALUES
    ('Nguy', 'nguy', 1),
    ('Thuc', 'thuc', 2),
    ('Ngo', 'ngo', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO servers (name, code, sort_order) VALUES
    ('Server 1', 's1', 1),
    ('Server 2', 's2', 2),
    ('Server 3', 's3', 3),
    ('Server 5', 's5', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (
    slug,
    title,
    description,
    server_id,
    nation_id,
    power_score,
    level,
    vip_level,
    price,
    installment_price,
    original_price,
    status,
    thumbnail_url,
    highlights,
    is_featured
)
SELECT
    'nick-omg3q-vip-12-full-tuong-do-s1',
    'Nick OMG3Q VIP 12 full tuong do server S1',
    'Tai khoan VIP 12, luc chien cao, hop cho nguoi muon mua nick OMG3Q S1 co kha nang leo top nhanh.',
    s.id,
    n.id,
    2500000,
    120,
    12,
    5000000,
    null,
    7000000,
    'available',
    null,
    '["VIP 12", "Full tuong do", "Server S1"]'::jsonb,
    true
FROM servers s
JOIN nations n ON n.code = 'nguy'
WHERE s.code = 's1'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO accounts (
    slug,
    title,
    description,
    server_id,
    nation_id,
    power_score,
    level,
    vip_level,
    price,
    installment_price,
    original_price,
    status,
    thumbnail_url,
    highlights,
    is_featured
)
SELECT
    'nick-omg3q-vip-10-da-doi-hinh-thuc-s2',
    'Nick OMG3Q VIP 10 doi hinh Thuc server S2',
    'Nick da build on dinh theo huong can bang, phu hop nguoi can gia tot va muon vao game nhanh.',
    s.id,
    n.id,
    1800000,
    110,
    10,
    3200000,
    null,
    4200000,
    'available',
    null,
    '["VIP 10", "Doi hinh Thuc", "Gia can bang"]'::jsonb,
    true
FROM servers s
JOIN nations n ON n.code = 'thuc'
WHERE s.code = 's2'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO accounts (
    slug,
    title,
    description,
    server_id,
    nation_id,
    power_score,
    level,
    vip_level,
    price,
    installment_price,
    original_price,
    status,
    thumbnail_url,
    highlights,
    is_featured
)
SELECT
    'nick-omg3q-vip-8-luc-chien-on-s3',
    'Nick OMG3Q VIP 8 luc chien on server S3',
    'Phan khuc gia mem, co san hero chu luc, phu hop nguoi tim nick OMG3Q gia re ma van de choi.',
    s.id,
    n.id,
    1200000,
    95,
    8,
    1900000,
    null,
    2500000,
    'available',
    null,
    '["VIP 8", "Gia re", "Server S3"]'::jsonb,
    false
FROM servers s
JOIN nations n ON n.code = 'ngo'
WHERE s.code = 's3'
ON CONFLICT (slug) DO NOTHING;
