-- ============================================
-- FLYTRIPVISA D1 DATABASE SCHEMA
-- ============================================

-- 1. VISAS TABLE - ভিসা প্যাকেজ সংরক্ষণ
CREATE TABLE IF NOT EXISTS visas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    flag TEXT NOT NULL,
    price TEXT NOT NULL,
    visaType TEXT NOT NULL,
    description TEXT,
    processing_time TEXT,
    validity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. APPLICATIONS TABLE - ভিসা আবেদন সংরক্ষণ
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    visa_id INTEGER,
    user_id TEXT,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    country TEXT NOT NULL,
    visa_type TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Normal',
    submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (visa_id) REFERENCES visas(id)
);

-- 3. USERS TABLE - ইউজার তথ্য
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- 4. CHAT_HISTORY TABLE - চ্যাট হিস্টোরি
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    session_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    tokens_used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. FILE_METADATA TABLE - R2 ফাইল মেটাডেটা
CREATE TABLE IF NOT EXISTS file_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_key TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    user_id TEXT,
    application_id TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- 6. PAYMENTS TABLE - পেমেন্ট ট্র্যাকিং
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id TEXT,
    user_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'Pending',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. NOTIFICATIONS TABLE - নোটিফিকেশন
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    type TEXT,
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- INDEXES - পারফরম্যান্সের জন্য
-- ============================================
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_country ON applications(country);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- INITIAL DATA - ডেমো ভিসা প্যাকেজ
-- ============================================
INSERT INTO visas (name, flag, price, visaType, description, processing_time, validity) VALUES
    ('Dubai', '🇦🇪', '$290', 'Tourist Visa', '30 days tourist visa for UAE', '3-5 business days', '30 days'),
    ('Singapore', '🇸🇬', '$160', 'Express Visa', 'Express tourist visa for Singapore', '1-2 business days', '30 days'),
    ('Malaysia', '🇲🇾', '$140', 'E-Visa', 'Electronic visa for Malaysia', '2-3 business days', '30 days'),
    ('Thailand', '🇹🇭', '$185', 'Visa on Arrival', 'Visa on arrival for Thailand', 'Same day', '15 days'),
    ('United Kingdom', '🇬🇧', '$670', 'Standard Visitor', '6 months standard visitor visa', '15-20 business days', '6 months'),
    ('Canada', '🇨🇦', '$750', 'Tourist Visa', 'Canadian tourist visa', '20-30 business days', '6 months'),
    ('USA', '🇺🇸', '$790', 'B1/B2 Visa', 'US tourist/business visa', '30-45 business days', '10 years'),
    ('Saudi Arabia', '🇸🇦', '$350', 'Umrah & Tourist', 'Umrah and tourist visa', '5-7 business days', '30 days'),
    ('India', '🇮🇳', '$55', 'Tourist E-Visa', 'Electronic tourist visa for India', '2-3 business days', '30 days'),
    ('Turkey', '🇹🇷', '$365', 'Tourist Sticker', 'Tourist sticker visa for Turkey', '7-10 business days', '90 days'),
    ('Vietnam', '🇻🇳', '$115', 'E-Visa Approval', 'E-visa approval letter', '2-3 business days', '30 days'),
    ('Maldives', '🇲🇻', '$120', 'On Arrival', 'Visa on arrival for Maldives', 'Same day', '30 days'),
    ('Japan', '🇯🇵', '$260', 'Short-term Visa', 'Short-term tourist visa', '10-14 business days', '90 days'),
    ('China', '🇨🇳', '$310', 'L Category', 'Tourist visa for China', '7-10 business days', '30 days'),
    ('Australia', '🇦🇺', '$580', 'Visitor Subclass 600', 'Tourist visa for Australia', '20-25 business days', '12 months'),
    ('France', '🇫🇷', '$470', 'Schengen Visa', 'Schengen tourist visa', '15-20 business days', '90 days'),
    ('Germany', '🇩🇪', '$485', 'Schengen Visit', 'Schengen visit visa', '15-20 business days', '90 days'),
    ('Italy', '🇮🇹', '$480', 'Tourist Schengen', 'Schengen tourist visa', '15-20 business days', '90 days'),
    ('South Korea', '🇰🇷', '$275', 'Tourist Visa', 'Tourist visa for South Korea', '10-14 business days', '90 days'),
    ('Sri Lanka', '🇱🇰', '$105', 'ETA Approval', 'Electronic Travel Authorization', '1-2 business days', '30 days');

-- ============================================
-- SAMPLE ADMIN USER (password: admin123)
-- ============================================
-- Note: Password hash is for 'admin123' using bcrypt
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
    ('usr_admin_001', 'admin@flytripvisa.site', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.cZx2Wq/.cZx2Wq/.cZx2Wq/.c', 'System Admin', 'admin');

-- ============================================
-- SAMPLE APPLICATIONS (Demo)
-- ============================================
INSERT INTO applications (id, email, country, status, priority, full_name, phone, visa_type) VALUES
    ('app_001', 'user1@example.com', 'Dubai', 'Approved', 'High', 'Md. Rahman', '+8801712345678', 'Tourist Visa'),
    ('app_002', 'user2@example.com', 'Singapore', 'Pending', 'Normal', 'Sadia Khan', '+8801812345678', 'Express Visa'),
    ('app_003', 'user3@example.com', 'USA', 'Rejected', 'Normal', 'Imran Hossain', '+8801912345678', 'B1/B2 Visa');

-- ============================================
-- TRIGGERS - অটো আপডেট টাইমস্ট্যাম্প
-- ============================================
CREATE TRIGGER update_visas_timestamp 
AFTER UPDATE ON visas
BEGIN
    UPDATE visas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_applications_timestamp 
AFTER UPDATE ON applications
BEGIN
    UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;