-- =============================================
-- MIGRASI: TAMBAH RINCIAN REALISASI (JSON)
-- =============================================

ALTER TABLE rencana_kerja
ADD COLUMN IF NOT EXISTS rincian_realisasi JSONB DEFAULT '[]'::jsonb;

-- Selesai
SELECT 'Kolom riwayat realisasi berhasil ditambahkan!' AS status;
