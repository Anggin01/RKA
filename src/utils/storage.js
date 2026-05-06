// Storage utility dengan integrasi Supabase (Nama Tabel Indonesia)
import { supabase } from './supabaseClient';

// =============================================
// KEEP-ALIVE: Mencegah Supabase Project di-pause
// =============================================

// Fungsi untuk menjaga project tetap aktif
export const keepAlive = async () => {
    try {
        // Simple ping ke database
        const { data, error } = await supabase
            .from('pagu_seksi')
            .select('seksi_id')
            .limit(1);

        if (error) throw error;

        console.log('✅ Supabase keep-alive ping berhasil:', new Date().toLocaleString('id-ID'));
        return true;
    } catch (error) {
        console.error('❌ Keep-alive ping gagal:', error);
        return false;
    }
};

// Auto ping setiap 5 menit saat aplikasi berjalan
let keepAliveInterval = null;

export const startKeepAlive = () => {
    if (keepAliveInterval) return; // Sudah berjalan

    // Ping pertama
    keepAlive();

    // Ping setiap 5 menit (300000 ms)
    keepAliveInterval = setInterval(() => {
        keepAlive();
    }, 5 * 60 * 1000);

    console.log('🟢 Keep-alive service dimulai');
};

export const stopKeepAlive = () => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        console.log('🔴 Keep-alive service dihentikan');
    }
};

// =============================================
// RENCANA KERJA - OPERASI SUPABASE
// =============================================

// Ambil rencana kerja untuk seksi tertentu
export const getWorkPlans = async (sectionId) => {
    try {
        const { data, error } = await supabase
            .from('rencana_kerja')
            .select('*')
            .eq('seksi_id', sectionId)
            .order('tenggat', { ascending: true });

        if (error) throw error;

        // Transform data ke format yang digunakan komponen
        return data.map(plan => ({
            id: plan.id,
            title: plan.judul,
            description: plan.deskripsi,
            budget: plan.anggaran || 0,
            realization: plan.realisasi || 0,
            rincianRealisasi: plan.rincian_realisasi || [],
            lockPagu: plan.lock_pagu || 0,
            status: plan.status,
            deadline: plan.tenggat,
            category: plan.kategori || 'Belanja Barang',
            programId: plan.program_id || null,
            subProgramId: plan.sub_program_id || null,
            outputId: plan.output_id || null,
            subOutputId: plan.sub_output_id || null,
            komponenId: plan.komponen_id || null,
            subKomponenId: plan.sub_komponen_id || null,
            akunId: plan.akun_id || null,
            itemId: plan.item_id || null,
        }));
    } catch (error) {
        console.error('Error mengambil rencana kerja:', error);
        return [];
    }
};

// Tambah rencana kerja baru
export const addWorkPlan = async (sectionId, workPlan) => {
    try {
        const { data, error } = await supabase
            .from('rencana_kerja')
            .insert([{
                seksi_id: sectionId,
                judul: workPlan.title,
                deskripsi: workPlan.description || null,
                anggaran: workPlan.budget || 0,
                realisasi: workPlan.realization || 0,
                rincian_realisasi: workPlan.rincianRealisasi || [],
                lock_pagu: workPlan.lockPagu || 0,
                status: workPlan.status || 'pending',
                tenggat: workPlan.deadline,
                kategori: workPlan.category || 'Belanja Barang',
                program_id: workPlan.programId || null,
                sub_program_id: workPlan.subProgramId || null,
                output_id: workPlan.outputId || null,
                sub_output_id: workPlan.subOutputId || null,
                komponen_id: workPlan.komponenId || null,
                sub_komponen_id: workPlan.subKomponenId || null,
                akun_id: workPlan.akunId || null,
                item_id: workPlan.itemId || null,
            }])
            .select()
            .single();

        if (error) throw error;

        // Return dalam format yang digunakan komponen
        return {
            id: data.id,
            title: data.judul,
            description: data.deskripsi,
            budget: data.anggaran,
            realization: data.realisasi,
            rincianRealisasi: data.rincian_realisasi || [],
            lockPagu: data.lock_pagu || 0,
            status: data.status,
            deadline: data.tenggat,
            category: data.kategori,
            programId: data.program_id || null,
            subProgramId: data.sub_program_id || null,
            outputId: data.output_id || null,
            subOutputId: data.sub_output_id || null,
            komponenId: data.komponen_id || null,
            subKomponenId: data.sub_komponen_id || null,
            akunId: data.akun_id || null,
            itemId: data.item_id || null,
        };
    } catch (error) {
        console.error('Error menambah rencana kerja:', error);
        return null;
    }
};

// Update rencana kerja
export const updateWorkPlan = async (sectionId, planId, updates) => {
    try {
        const { data, error } = await supabase
            .from('rencana_kerja')
            .update({
                judul: updates.title,
                deskripsi: updates.description,
                anggaran: updates.budget || 0,
                realisasi: updates.realization || 0,
                rincian_realisasi: updates.rincianRealisasi || [],
                lock_pagu: updates.lockPagu || 0,
                status: updates.status,
                tenggat: updates.deadline,
                kategori: updates.category,
                program_id: updates.programId || null,
                sub_program_id: updates.subProgramId || null,
                output_id: updates.outputId || null,
                sub_output_id: updates.subOutputId || null,
                komponen_id: updates.komponenId || null,
                sub_komponen_id: updates.subKomponenId || null,
                akun_id: updates.akunId || null,
                item_id: updates.itemId || null,
                diperbarui_pada: new Date().toISOString()
            })
            .eq('id', planId)
            .eq('seksi_id', sectionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error memperbarui rencana kerja:', error);
        return null;
    }
};

// Hapus rencana kerja
export const deleteWorkPlan = async (sectionId, planId) => {
    try {
        const { error } = await supabase
            .from('rencana_kerja')
            .delete()
            .eq('id', planId)
            .eq('seksi_id', sectionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error menghapus rencana kerja:', error);
        return false;
    }
};

// Ambil semua rencana kerja untuk semua seksi (untuk dashboard)
export const getAllWorkPlans = async () => {
    try {
        const { data, error } = await supabase
            .from('rencana_kerja')
            .select('*')
            .order('tenggat', { ascending: true });

        if (error) throw error;

        // Kelompokkan berdasarkan seksi_id
        const grouped = {};
        data.forEach(plan => {
            if (!grouped[plan.seksi_id]) {
                grouped[plan.seksi_id] = [];
            }
            grouped[plan.seksi_id].push({
                id: plan.id,
                title: plan.judul,
                description: plan.deskripsi,
                budget: plan.anggaran || 0,
                realization: plan.realisasi || 0,
                lockPagu: plan.lock_pagu || 0,
                status: plan.status,
                deadline: plan.tenggat,
                category: plan.kategori || 'Belanja Barang',
                programId: plan.program_id || null,
                subProgramId: plan.sub_program_id || null,
                outputId: plan.output_id || null,
                subOutputId: plan.sub_output_id || null,
                komponenId: plan.komponen_id || null,
                subKomponenId: plan.sub_komponen_id || null,
                akunId: plan.akun_id || null,
                itemId: plan.item_id || null,
            });
        });

        return grouped;
    } catch (error) {
        console.error('Error mengambil semua rencana kerja:', error);
        return {};
    }
};

// =============================================
// PAGU SEKSI - OPERASI SUPABASE
// =============================================

// Ambil pagu seksi
export const getSectionPagu = async (sectionId) => {
    try {
        const { data, error } = await supabase
            .from('pagu_seksi')
            .select('pagu')
            .eq('seksi_id', sectionId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data?.pagu || 0;
    } catch (error) {
        console.error('Error mengambil pagu seksi:', error);
        return 0;
    }
};

// Update pagu seksi
export const updateSectionPagu = async (sectionId, pagu) => {
    try {
        const { data, error } = await supabase
            .from('pagu_seksi')
            .upsert({
                seksi_id: sectionId,
                pagu: pagu,
                diperbarui_pada: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error memperbarui pagu seksi:', error);
        return null;
    }
};

// Hitung anggaran seksi
export const calculateSectionBudget = async (sectionId) => {
    try {
        const pagu = await getSectionPagu(sectionId);
        const plans = await getWorkPlans(sectionId);

        const terpakai = plans
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.realization || p.budget || 0), 0);

        const progress = pagu > 0 ? (terpakai / pagu) * 100 : 0;

        // Sisa Sementara = Pagu - Total Pagu Kegiatan
        const totalPaguKegiatan = plans.reduce((sum, p) => sum + (p.budget || 0), 0);
        const sisaSementara = pagu - totalPaguKegiatan;

        // Sisa Bersih = Pagu - Total Realisasi
        const totalRealisasi = plans.reduce((sum, p) => sum + (parseFloat(p.realization) || 0), 0);
        const sisaBersih = pagu - totalRealisasi;

        return {
            totalPagu: pagu,
            terpakai,
            sisa: pagu - terpakai,
            progress,
            sisaSementara,
            sisaBersih
        };
    } catch (error) {
        console.error('Error menghitung anggaran seksi:', error);
        return { totalPagu: 0, terpakai: 0, sisa: 0, progress: 0, sisaSementara: 0, sisaBersih: 0 };
    }
};

// =============================================
// ACARA KALENDER - OPERASI SUPABASE
// =============================================

// Ambil acara kalender
export const getCalendarEvents = async () => {
    try {
        const { data, error } = await supabase
            .from('acara_kalender')
            .select('*')
            .order('tanggal', { ascending: true });

        if (error) throw error;

        // Transform ke format komponen
        return (data || []).map(event => ({
            id: event.id,
            date: event.tanggal,
            title: event.judul,
            section: event.bagian,
            status: event.status
        }));
    } catch (error) {
        console.error('Error mengambil acara kalender:', error);
        return [];
    }
};

// Tambah acara kalender
export const addCalendarEvent = async (event) => {
    try {
        const { data, error } = await supabase
            .from('acara_kalender')
            .insert([{
                tanggal: event.date,
                judul: event.title,
                bagian: event.section,
                status: event.status || 'upcoming'
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            date: data.tanggal,
            title: data.judul,
            section: data.bagian,
            status: data.status
        };
    } catch (error) {
        console.error('Error menambah acara kalender:', error);
        return null;
    }
};

// Update acara kalender
export const updateCalendarEvent = async (eventId, updates) => {
    try {
        const updateData = {};
        if (updates.date) updateData.tanggal = updates.date;
        if (updates.title) updateData.judul = updates.title;
        if (updates.section) updateData.bagian = updates.section;
        if (updates.status) updateData.status = updates.status;

        const { data, error } = await supabase
            .from('acara_kalender')
            .update(updateData)
            .eq('id', eventId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error memperbarui acara kalender:', error);
        return null;
    }
};

// Hapus acara kalender
export const deleteCalendarEvent = async (eventId) => {
    try {
        const { error } = await supabase
            .from('acara_kalender')
            .delete()
            .eq('id', eventId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error menghapus acara kalender:', error);
        return false;
    }
};

// =============================================
// PERHITUNGAN ANGGARAN
// =============================================

// Hitung total anggaran terpakai dari semua rencana kerja
export const calculateTotalUsedBudget = async () => {
    try {
        const allPlans = await getAllWorkPlans();
        let total = 0;

        Object.values(allPlans).forEach(plans => {
            plans.forEach(plan => {
                if (plan.status === 'completed') {
                    total += plan.realization || plan.budget || 0;
                }
            });
        });

        return total;
    } catch (error) {
        console.error('Error menghitung total anggaran terpakai:', error);
        return 0;
    }
};

// =============================================
// URAIAN MASTER - OPERASI SUPABASE
// Program > Sub-Program > Output > Sub-Output > Komponen > Sub-Komponen > Akun > Item
// =============================================

// Cek apakah tabel uraian_master sudah ada
export const checkUraianTableExists = async () => {
    try {
        const { error } = await supabase
            .from('uraian_master')
            .select('id')
            .limit(1);
        // 42P01 = undefined_table (table doesn't exist)
        if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.hint?.includes('uraian_master'))) {
            return false;
        }
        return !error;
    } catch {
        return false;
    }
};

// Ambil semua uraian berdasarkan jenis
export const getUraianByJenis = async (jenis, parentId = null) => {
    try {
        // Single order call to avoid PostgREST URL encoding issues
        let query = supabase
            .from('uraian_master')
            .select('*')
            .eq('jenis', jenis)
            .eq('aktif', true)
            .order('urutan');

        if (parentId !== null) {
            query = query.eq('parent_id', parentId);
        }

        const { data, error } = await query;

        // Tabel belum dibuat — gagal diam-diam
        if (error) {
            const isMissingTable = error.code === '42P01'
                || (error.message || '').includes('does not exist')
                || error.details?.includes('uraian_master');
            if (!isMissingTable) {
                console.warn('getUraianByJenis error:', error.message);
            }
            return [];
        }
        return data || [];
    } catch {
        return [];
    }
};

// Ambil semua uraian (untuk admin)
export const getAllUraian = async () => {
    try {
        const { data, error } = await supabase
            .from('uraian_master')
            .select('*')
            .order('jenis', { ascending: true })
            .order('urutan', { ascending: true })
            .order('kode', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error mengambil semua uraian:', error);
        return [];
    }
};

// Tambah uraian baru
export const addUraianItem = async (item) => {
    try {
        const { data, error } = await supabase
            .from('uraian_master')
            .insert([{
                kode: item.kode,
                nama: item.nama,
                jenis: item.jenis,
                parent_id: item.parentId || null,
                seksi_id: item.seksiId || null,
                urutan: item.urutan || 0,
                aktif: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error menambah uraian:', error);
        return null;
    }
};

// Update uraian
export const updateUraianItem = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('uraian_master')
            .update({
                kode: updates.kode,
                nama: updates.nama,
                jenis: updates.jenis,
                parent_id: updates.parentId || null,
                urutan: updates.urutan || 0,
                aktif: updates.aktif !== undefined ? updates.aktif : true,
                diperbarui_pada: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error memperbarui uraian:', error);
        return null;
    }
};

// Hapus uraian
export const deleteUraianItem = async (id) => {
    try {
        const { error } = await supabase
            .from('uraian_master')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error menghapus uraian:', error);
        return false;
    }
};

// Ambil satu uraian berdasarkan ID
export const getUraianById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('uraian_master')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error mengambil uraian by ID:', error);
        return null;
    }
};

// =============================================
// FUNGSI LEGACY (untuk kompatibilitas)
// =============================================

export const loadData = () => {
    console.warn('loadData() sudah tidak digunakan. Gunakan fungsi async Supabase.');
    return { workPlans: {}, sectionPagu: {}, calendarEvents: [], budgetData: {} };
};

export const saveData = () => {
    console.warn('saveData() sudah tidak digunakan. Data otomatis tersimpan ke Supabase.');
    return true;
};

export const saveWorkPlans = () => {
    console.warn('saveWorkPlans() sudah tidak digunakan. Gunakan addWorkPlan/updateWorkPlan.');
    return true;
};

export const getBudgetData = async () => {
    const totalPagu = await calculateTotalUsedBudget();
    return { totalPagu };
};

export const resetToDefault = () => {
    console.warn('resetToDefault() dinonaktifkan dalam mode Supabase.');
    return {};
};
