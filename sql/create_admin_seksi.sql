-- =============================================
-- TABEL ADMIN SEKSI
-- Jalankan SQL ini di Supabase SQL Editor
-- =============================================

-- Buat tabel admin_seksi
CREATE TABLE IF NOT EXISTS admin_seksi (
    id SERIAL PRIMARY KEY,
    seksi_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL DEFAULT '',
    password VARCHAR(100) NOT NULL DEFAULT '',
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT false,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE admin_seksi ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan semua operasi (karena menggunakan anon key)
CREATE POLICY "Allow all operations on admin_seksi"
    ON admin_seksi
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert data default untuk setiap seksi
INSERT INTO admin_seksi (seksi_id, username, password, can_view, can_edit, is_active) VALUES
    ('tikim', 'admin_tikim', 'tikim', true, false, false),
    ('inteldakim', 'admin_inteldakim', 'inteldakim', true, false, false),
    ('lalintalkim', 'admin_lalintalkim', 'lalintalkim', true, false, false),
    ('umum', 'admin_umum', 'umum', true, false, false),
    ('keuangan', 'admin_keuangan', 'keuangan', true, false, false),
    ('kepegawaian', 'admin_kepegawaian', 'kepegawaian', true, false, false),
    ('fasilitatif', 'admin_fasilitatif', 'fasilitatif', true, false, false),
    ('reformasi-birokrasi', 'admin_reformasi', 'reformasi', true, false, false)
ON CONFLICT (seksi_id) DO NOTHING;
