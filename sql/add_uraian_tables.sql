-- =============================================
-- MIGRASI: TABEL URAIAN ANGGARAN
-- Untuk Aplikasi RKA - Kantor Imigrasi Kelas II TPI Pematang Siantar
--
-- CARA MENJALANKAN:
-- 1. Buka https://supabase.com/dashboard/project/sbhpbmwamqhxwisuqruq/sql/new
-- 2. Salin seluruh isi file ini
-- 3. Klik "Run"
-- =============================================

-- =============================================
-- BAGIAN 1: BUAT TABEL uraian_master
-- =============================================

CREATE TABLE IF NOT EXISTS uraian_master (
    id          SERIAL PRIMARY KEY,
    kode        VARCHAR(50) NOT NULL,
    nama        TEXT NOT NULL,
    jenis       VARCHAR(50) NOT NULL
                CHECK (jenis IN (
                    'program','sub_program','output','sub_output',
                    'komponen','sub_komponen','akun','item'
                )),
    parent_id   INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    seksi_id    VARCHAR(50),           -- NULL = berlaku untuk semua seksi
    urutan      INTEGER DEFAULT 0,
    aktif       BOOLEAN DEFAULT true,
    dibuat_pada      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diperbarui_pada  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index performa
CREATE INDEX IF NOT EXISTS idx_uraian_jenis    ON uraian_master(jenis);
CREATE INDEX IF NOT EXISTS idx_uraian_parent   ON uraian_master(parent_id);
CREATE INDEX IF NOT EXISTS idx_uraian_aktif    ON uraian_master(aktif);
CREATE INDEX IF NOT EXISTS idx_uraian_seksi    ON uraian_master(seksi_id);

-- Row Level Security
ALTER TABLE uraian_master ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'uraian_master'
          AND policyname = 'Allow all operations on uraian_master'
    ) THEN
        CREATE POLICY "Allow all operations on uraian_master"
            ON uraian_master FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Trigger auto-update diperbarui_pada
CREATE OR REPLACE FUNCTION update_uraian_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.diperbarui_pada = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uraian_master_updated ON uraian_master;
CREATE TRIGGER trg_uraian_master_updated
    BEFORE UPDATE ON uraian_master
    FOR EACH ROW EXECUTE FUNCTION update_uraian_timestamp();


-- =============================================
-- BAGIAN 2: UPDATE TABEL rencana_kerja
-- =============================================

ALTER TABLE rencana_kerja
    ADD COLUMN IF NOT EXISTS program_id      INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sub_program_id  INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS output_id       INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sub_output_id   INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS komponen_id     INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sub_komponen_id INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS akun_id         INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS item_id         INTEGER REFERENCES uraian_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lock_pagu       INTEGER DEFAULT 0;


-- =============================================
-- BAGIAN 3: DATA MASTER URAIAN
-- Struktur Anggaran Kantor Imigrasi (Standar DIPA)
-- Sesuaikan kode dan nama dengan DIPA instansi Anda
-- =============================================

-- ----------------------------------------
-- PROGRAM (Level 1)
-- ----------------------------------------
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BF', 'Program Penegakan Hukum dan Pelayanan Publik Bidang Imigrasi', 'program', NULL, 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------
-- SUB-PROGRAM (Level 2)
-- ----------------------------------------
-- Referensi ID Program BF
WITH prog AS (SELECT id FROM uraian_master WHERE kode = 'BF' AND jenis = 'program' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BF.6161', 'Penyelenggaraan Fungsi Pengkoordinasian, Pelayanan dan Penegakan Hukum Keimigrasian di Wilayah',
    'sub_program', (SELECT id FROM prog), 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------
-- OUTPUT (Level 3)
-- ----------------------------------------
WITH subprog AS (SELECT id FROM uraian_master WHERE kode = 'BF.6161' AND jenis = 'sub_program' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BAA', 'Layanan Dokumen Perjalanan RI',                       'output', (SELECT id FROM subprog), 1),
('BAB', 'Layanan Izin Keimigrasian',                           'output', (SELECT id FROM subprog), 2),
('BAC', 'Layanan Pengawasan Keimigrasian',                     'output', (SELECT id FROM subprog), 3),
('BAD', 'Layanan Penindakan Keimigrasian',                     'output', (SELECT id FROM subprog), 4),
('BAE', 'Layanan Dukungan Manajemen Internal',                 'output', (SELECT id FROM subprog), 5)
ON CONFLICT DO NOTHING;

-- ----------------------------------------
-- SUB-OUTPUT (Level 4) — Di bawah tiap Output
-- ----------------------------------------
-- Sub-Output BAA
WITH out AS (SELECT id FROM uraian_master WHERE kode = 'BAA' AND jenis = 'output' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BAA.001', 'Penerbitan Paspor Biasa',                         'sub_output', (SELECT id FROM out), 1),
('BAA.002', 'Penerbitan Paspor Elektronik',                    'sub_output', (SELECT id FROM out), 2),
('BAA.003', 'Perpanjangan Paspor',                             'sub_output', (SELECT id FROM out), 3)
ON CONFLICT DO NOTHING;

-- Sub-Output BAB
WITH out AS (SELECT id FROM uraian_master WHERE kode = 'BAB' AND jenis = 'output' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BAB.001', 'Penerbitan Izin Tinggal Kunjungan (ITK)',         'sub_output', (SELECT id FROM out), 1),
('BAB.002', 'Penerbitan Izin Tinggal Terbatas (ITAS)',         'sub_output', (SELECT id FROM out), 2),
('BAB.003', 'Penerbitan Izin Tinggal Tetap (ITAP)',            'sub_output', (SELECT id FROM out), 3)
ON CONFLICT DO NOTHING;

-- Sub-Output BAC
WITH out AS (SELECT id FROM uraian_master WHERE kode = 'BAC' AND jenis = 'output' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BAC.001', 'Operasi Pengawasan Orang Asing',                  'sub_output', (SELECT id FROM out), 1),
('BAC.002', 'Rapat Koordinasi Tim Pora',                       'sub_output', (SELECT id FROM out), 2)
ON CONFLICT DO NOTHING;

-- Sub-Output BAE (Dukungan Manajemen)
WITH out AS (SELECT id FROM uraian_master WHERE kode = 'BAE' AND jenis = 'output' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('BAE.001', 'Layanan Perkantoran',                             'sub_output', (SELECT id FROM out), 1),
('BAE.002', 'Layanan Sarana dan Prasarana Internal',           'sub_output', (SELECT id FROM out), 2)
ON CONFLICT DO NOTHING;

-- ----------------------------------------
-- KOMPONEN (Level 5)
-- ----------------------------------------
-- Komponen standar yang dipakai di banyak sub-output
WITH so AS (SELECT id FROM uraian_master WHERE kode = 'BAA.001' AND jenis = 'sub_output' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('A', 'Pelaksanaan Kegiatan',  'komponen', (SELECT id FROM so), 1),
('B', 'Subbagian Kepegawaian', 'komponen', (SELECT id FROM so), 2)
ON CONFLICT DO NOTHING;

WITH so AS (SELECT id FROM uraian_master WHERE kode = 'BAE.001' AND jenis = 'sub_output' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('A', 'Operasional Perkantoran', 'komponen', (SELECT id FROM so), 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------
-- AKUN (Level 7 — biasa dipakai langsung)
-- Kode akun standar DIPA / MAK
-- ----------------------------------------
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('511111', 'Belanja Gaji Pokok PNS',                                'akun', NULL, 1),
('511119', 'Belanja Pembulatan Gaji PNS',                           'akun', NULL, 2),
('511121', 'Belanja Tunj. Suami/Istri PNS',                         'akun', NULL, 3),
('511122', 'Belanja Tunj. Anak PNS',                                'akun', NULL, 4),
('511123', 'Belanja Tunj. Struktural PNS',                          'akun', NULL, 5),
('511124', 'Belanja Tunj. Fungsional PNS',                          'akun', NULL, 6),
('511125', 'Belanja Tunj. PPh PNS',                                 'akun', NULL, 7),
('511126', 'Belanja Tunj. Beras PNS',                               'akun', NULL, 8),
('511129', 'Belanja Uang Makan PNS',                                'akun', NULL, 9),
('511151', 'Belanja Tunj. Umum PNS',                                'akun', NULL, 10),
('512211', 'Belanja Uang Lembur',                                   'akun', NULL, 11),
('521111', 'Belanja Keperluan Perkantoran',                         'akun', NULL, 12),
('521113', 'Belanja Penambah Daya Tahan Tubuh',                     'akun', NULL, 13),
('521114', 'Belanja Pengiriman Surat Dinas',                        'akun', NULL, 14),
('521115', 'Honor Operasional Satuan Kerja',                        'akun', NULL, 15),
('521119', 'Belanja Barang Operasional Lainnya',                    'akun', NULL, 16),
('521211', 'Belanja Bahan',                                         'akun', NULL, 17),
('521213', 'Honor Output Kegiatan',                                 'akun', NULL, 18),
('521219', 'Belanja Barang Non Operasional Lainnya',                'akun', NULL, 19),
('521811', 'Belanja Barang Persediaan Barang Konsumsi',             'akun', NULL, 20),
('522111', 'Belanja Langganan Listrik',                             'akun', NULL, 21),
('522112', 'Belanja Langganan Telepon',                             'akun', NULL, 22),
('522113', 'Belanja Langganan Air',                                 'akun', NULL, 23),
('522119', 'Belanja Langganan Daya dan Jasa Lainnya',               'akun', NULL, 24),
('522141', 'Belanja Sewa',                                          'akun', NULL, 25),
('522151', 'Belanja Jasa Profesi',                                  'akun', NULL, 26),
('522191', 'Belanja Jasa Lainnya',                                  'akun', NULL, 27),
('523111', 'Belanja Pemeliharaan Gedung dan Bangunan',              'akun', NULL, 28),
('523119', 'Belanja Pemeliharaan Gedung dan Bangunan Lainnya',     'akun', NULL, 29),
('523121', 'Belanja Pemeliharaan Peralatan dan Mesin',              'akun', NULL, 30),
('523129', 'Belanja Pemeliharaan Peralatan dan Mesin Lainnya',     'akun', NULL, 31),
('524111', 'Belanja Perjalanan Dinas Biasa',                        'akun', NULL, 32),
('524113', 'Belanja Perjalanan Dinas Dalam Kota',                   'akun', NULL, 33),
('524114', 'Belanja Perjalanan Dinas Paket Meeting Dalam Kota',    'akun', NULL, 34),
('524119', 'Belanja Perjalanan Dinas Paket Meeting Luar Kota',     'akun', NULL, 35),
('532111', 'Belanja Modal Peralatan dan Mesin',                     'akun', NULL, 36),
('533111', 'Belanja Modal Gedung dan Bangunan',                     'akun', NULL, 37),
('536111', 'Belanja Modal Lainnya',                                 'akun', NULL, 38)
ON CONFLICT DO NOTHING;

-- ----------------------------------------
-- ITEM (Level 8 — Rincian di bawah Akun)
-- Contoh item di bawah beberapa akun umum
-- ----------------------------------------

-- Item untuk 521211 - Belanja Bahan
WITH akun AS (SELECT id FROM uraian_master WHERE kode = '521211' AND jenis = 'akun' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('001', 'Konsumsi Rapat/Kegiatan',                     'item', (SELECT id FROM akun), 1),
('002', 'Bahan/Material Kegiatan',                     'item', (SELECT id FROM akun), 2),
('003', 'Bahan Habis Pakai ATK',                       'item', (SELECT id FROM akun), 3),
('004', 'Bahan Cetak/Penggandaan',                     'item', (SELECT id FROM akun), 4)
ON CONFLICT DO NOTHING;

-- Item untuk 521219 - Belanja Barang Non Operasional Lainnya
WITH akun AS (SELECT id FROM uraian_master WHERE kode = '521219' AND jenis = 'akun' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('001', 'Spanduk/Banner/Backdrop Kegiatan',            'item', (SELECT id FROM akun), 1),
('002', 'Dokumentasi Kegiatan',                        'item', (SELECT id FROM akun), 2),
('003', 'Kebutuhan Non Operasional Lainnya',           'item', (SELECT id FROM akun), 3)
ON CONFLICT DO NOTHING;

-- Item untuk 524111 - Belanja Perjalanan Dinas Biasa
WITH akun AS (SELECT id FROM uraian_master WHERE kode = '524111' AND jenis = 'akun' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('001', 'Tiket Transportasi',                          'item', (SELECT id FROM akun), 1),
('002', 'Uang Harian Perjalanan Dinas',                'item', (SELECT id FROM akun), 2),
('003', 'Penginapan/Hotel',                            'item', (SELECT id FROM akun), 3),
('004', 'Taksi/Transport Lokal',                       'item', (SELECT id FROM akun), 4)
ON CONFLICT DO NOTHING;

-- Item untuk 521111 - Belanja Keperluan Perkantoran
WITH akun AS (SELECT id FROM uraian_master WHERE kode = '521111' AND jenis = 'akun' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('001', 'Alat Tulis Kantor (ATK)',                     'item', (SELECT id FROM akun), 1),
('002', 'Toner/Cartridge Printer',                     'item', (SELECT id FROM akun), 2),
('003', 'Kertas HVS/Fotokopi',                         'item', (SELECT id FROM akun), 3),
('004', 'Perlengkapan Kebersihan Kantor',              'item', (SELECT id FROM akun), 4)
ON CONFLICT DO NOTHING;

-- Item untuk 523121 - Belanja Pemeliharaan Peralatan dan Mesin
WITH akun AS (SELECT id FROM uraian_master WHERE kode = '523121' AND jenis = 'akun' LIMIT 1)
INSERT INTO uraian_master (kode, nama, jenis, parent_id, urutan) VALUES
('001', 'Servis/Pemeliharaan Kendaraan Dinas',         'item', (SELECT id FROM akun), 1),
('002', 'Servis/Pemeliharaan Komputer & Printer',      'item', (SELECT id FROM akun), 2),
('003', 'Servis/Pemeliharaan AC',                      'item', (SELECT id FROM akun), 3),
('004', 'Servis Peralatan Elektronik Lainnya',         'item', (SELECT id FROM akun), 4)
ON CONFLICT DO NOTHING;

-- =============================================
-- SELESAI
-- =============================================
SELECT
    jenis,
    COUNT(*) AS jumlah
FROM uraian_master
GROUP BY jenis
ORDER BY
    CASE jenis
        WHEN 'program'      THEN 1
        WHEN 'sub_program'  THEN 2
        WHEN 'output'       THEN 3
        WHEN 'sub_output'   THEN 4
        WHEN 'komponen'     THEN 5
        WHEN 'sub_komponen' THEN 6
        WHEN 'akun'         THEN 7
        WHEN 'item'         THEN 8
    END;
