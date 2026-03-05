-- =============================================
-- TABEL ADMIN SEKSI (Update dengan Aktivasi)
-- Jalankan SQL ini di Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/sbhpbmwamqhxwisuqruq/sql/new
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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_seksi' AND policyname = 'Allow all operations on admin_seksi'
    ) THEN
        CREATE POLICY "Allow all operations on admin_seksi"
            ON admin_seksi
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Insert semua admin seksi (AKTIF, bisa view, belum bisa edit)
INSERT INTO admin_seksi (seksi_id, username, password, can_view, can_edit, is_active) VALUES
    ('tikim',              'admin_tikim',        'tikim2026',        true, false, true),
    ('inteldakim',         'admin_inteldakim',   'inteldakim2026',   true, false, true),
    ('lalintalkim',        'admin_lalintalkim',  'lalintalkim2026',  true, false, true),
    ('umum',               'admin_umum',         'umum2026',         true, false, true),
    ('keuangan',           'admin_keuangan',     'keuangan2026',     true, false, true),
    ('kepegawaian',        'admin_kepegawaian',  'kepegawaian2026',  true, false, true),
    ('fasilitatif',        'admin_fasilitatif',  'fasilitatif2026',  true, false, true),
    ('reformasi-birokrasi','admin_reformasi',    'reformasi2026',    true, false, true)
ON CONFLICT (seksi_id) DO UPDATE SET
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    can_view = EXCLUDED.can_view,
    is_active = EXCLUDED.is_active,
    diperbarui_pada = NOW();
