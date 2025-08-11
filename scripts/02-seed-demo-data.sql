-- Demo data for WhatsMoney
-- Insert demo admin user
INSERT INTO users (email, name, role, verified) VALUES 
('admin@whatsmoney.com', 'Admin WhatsMoney', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert demo host users
INSERT INTO users (email, name, role, phone, verified) VALUES 
('joao@example.com', 'João Silva', 'user', '+5511999999999', true),
('maria@example.com', 'Maria Santos', 'user', '+5511888888888', true),
('pedro@example.com', 'Pedro Costa', 'user', '+5511777777777', true)
ON CONFLICT (email) DO NOTHING;

-- Insert demo company users
INSERT INTO users (email, name, role, verified) VALUES 
('contato@techcorp.com', 'TechCorp Brasil', 'company', true),
('marketing@fashionbrand.com', 'Fashion Brand', 'company', true)
ON CONFLICT (email) DO NOTHING;

-- Insert host profiles
INSERT INTO host_profiles (user_id, price_per_post, niche, avg_views, bio, rating, total_reviews, points) 
SELECT u.id, 25.00, 'Tecnologia', 1500, 'Especialista em tecnologia e gadgets. Audiência engajada!', 4.8, 12, 150
FROM users u WHERE u.email = 'joao@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO host_profiles (user_id, price_per_post, niche, avg_views, bio, rating, total_reviews, points) 
SELECT u.id, 35.00, 'Moda', 2200, 'Influenciadora de moda feminina. Público jovem e ativo.', 4.9, 18, 220
FROM users u WHERE u.email = 'maria@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO host_profiles (user_id, price_per_post, niche, avg_views, bio, rating, total_reviews, points) 
SELECT u.id, 20.00, 'Esportes', 1800, 'Apaixonado por futebol e esportes em geral.', 4.7, 8, 95
FROM users u WHERE u.email = 'pedro@example.com'
ON CONFLICT DO NOTHING;

-- Insert company profiles
INSERT INTO company_profiles (user_id, company_name, industry, website, description) 
SELECT u.id, 'TechCorp Brasil', 'Tecnologia', 'https://techcorp.com.br', 'Líder em soluções tecnológicas para empresas.'
FROM users u WHERE u.email = 'contato@techcorp.com'
ON CONFLICT DO NOTHING;

INSERT INTO company_profiles (user_id, company_name, industry, website, description) 
SELECT u.id, 'Fashion Brand', 'Moda', 'https://fashionbrand.com', 'Marca de moda jovem e descolada.'
FROM users u WHERE u.email = 'marketing@fashionbrand.com'
ON CONFLICT DO NOTHING;

-- Insert demo ads
INSERT INTO ads (company_id, title, description, budget, target_niche, status) 
SELECT u.id, 'Novo Smartphone XYZ', 'Divulgue o lançamento do nosso novo smartphone com câmera de 108MP', 500.00, 'Tecnologia', 'active'
FROM users u WHERE u.email = 'contato@techcorp.com'
ON CONFLICT DO NOTHING;

INSERT INTO ads (company_id, title, description, budget, target_niche, status) 
SELECT u.id, 'Coleção Verão 2024', 'Promova nossa nova coleção de verão com peças exclusivas', 800.00, 'Moda', 'active'
FROM users u WHERE u.email = 'marketing@fashionbrand.com'
ON CONFLICT DO NOTHING;
