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
            status: plan.status,
            deadline: plan.tenggat,
            category: plan.kategori || 'Belanja Barang'
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
                status: workPlan.status || 'pending',
                tenggat: workPlan.deadline,
                kategori: workPlan.category || 'Belanja Barang'
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
            status: data.status,
            deadline: data.tenggat,
            category: data.kategori
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
                status: updates.status,
                tenggat: updates.deadline,
                kategori: updates.category,
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
                status: plan.status,
                deadline: plan.tenggat,
                category: plan.kategori || 'Belanja Barang'
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

        return {
            totalPagu: pagu,
            terpakai,
            sisa: pagu - terpakai,
            progress
        };
    } catch (error) {
        console.error('Error menghitung anggaran seksi:', error);
        return { totalPagu: 0, terpakai: 0, sisa: 0, progress: 0 };
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
