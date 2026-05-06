import { useState, useEffect, useRef } from 'react';
import {
    getWorkPlans, addWorkPlan, updateWorkPlan, deleteWorkPlan,
    getSectionPagu, updateSectionPagu,
    getUraianByJenis, addUraianItem, checkUraianTableExists, deleteUraianItem
} from '../utils/storage';
import FlatIcon from './FlatIcon';
import './SectionContent.css';

const JENIS_LIST = ['program', 'sub_program', 'output', 'sub_output', 'komponen', 'sub_komponen', 'akun', 'item'];

const JENIS_LABEL = {
    program: 'Program',
    sub_program: 'Sub-Program',
    output: 'Output',
    sub_output: 'Sub-Output',
    komponen: 'Komponen',
    sub_komponen: 'Sub-Komponen',
    akun: 'Akun',
    item: 'Item',
};

const SectionContent = ({ sectionId, sectionInfo, canEdit = true }) => {
    const [workPlans, setWorkPlans] = useState([]);
    const [pagu, setPagu] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [reportTab, setReportTab] = useState('ringkasan');
    const [saveStatus, setSaveStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingPagu, setIsEditingPagu] = useState(false);
    const reportRef = useRef(null);
    const now = new Date();

    // Uraian master data for dropdowns
    const [uraianData, setUraianData] = useState({
        program: [], sub_program: [], output: [], sub_output: [],
        komponen: [], sub_komponen: [], akun: [], item: []
    });

    // Quick-add uraian modal state
    const [showAddUraianModal, setShowAddUraianModal] = useState(false);
    const [addUraianForm, setAddUraianForm] = useState({ jenis: 'program', kode: '', nama: '', parentId: null });
    const [addUraianLoading, setAddUraianLoading] = useState(false);
    const [uraianTableMissing, setUraianTableMissing] = useState(false);
    const [activeRincianAdd, setActiveRincianAdd] = useState(null); // { index, jenis }

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        budget: '',
        realization: '',
        rincianRealisasi: [],
        category: 'Belanja Barang',
        status: 'pending',
        programId: '',
        subProgramId: '',
        outputId: '',
        subOutputId: '',
        komponenId: '',
        subKomponenId: '',
        akunId: '',
        itemId: '',
    });

    useEffect(() => {
        loadData();
        loadUraianData();
    }, [sectionId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const plans = await getWorkPlans(sectionId);
            setWorkPlans(plans);
            const sectionPagu = await getSectionPagu(sectionId);
            setPagu(sectionPagu);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadUraianData = async () => {
        // Cek dulu apakah tabel sudah ada sebelum load 8 request sekaligus
        const tableExists = await checkUraianTableExists();
        if (!tableExists) {
            setUraianTableMissing(true);
            return;
        }
        setUraianTableMissing(false);
        try {
            const results = await Promise.all(
                JENIS_LIST.map(jenis => getUraianByJenis(jenis))
            );
            const newData = {};
            JENIS_LIST.forEach((jenis, i) => { newData[jenis] = results[i]; });
            setUraianData(newData);
        } catch (error) {
            console.error('Error loading uraian data:', error);
        }
    };

    const showSaveStatus = (message) => {
        setSaveStatus(message);
        setTimeout(() => setSaveStatus(''), 2500);
    };

    const terpakai = workPlans
        .filter(wp => wp.status === 'completed')
        .reduce((sum, wp) => sum + (wp.realization || wp.budget || 0), 0);
    const sisa = pagu - terpakai;
    const usedPercentage = pagu > 0 ? Math.round((terpakai / pagu) * 100) : 0;

    // Sisa Sementara: Pagu - Total Pagu Kegiatan (sum of all activity budgets)
    const totalPaguKegiatan_all = workPlans.reduce((sum, wp) => sum + (wp.budget || 0), 0);
    const sisaSementara = pagu - totalPaguKegiatan_all;

    // Sisa Bersih: Pagu - Total Realisasi (sum of all activity realizations)
    const totalRealisasi_all = workPlans.reduce((sum, wp) => sum + (parseFloat(wp.realization) || 0), 0);
    const sisaBersih = pagu - totalRealisasi_all;

    const statusCounts = {
        completed: workPlans.filter(wp => wp.status === 'completed').length,
        ongoing: workPlans.filter(wp => wp.status === 'ongoing').length,
        pending: workPlans.filter(wp => wp.status === 'pending').length,
    };

    const completedPercentage = workPlans.length > 0
        ? Math.round((statusCounts.completed / workPlans.length) * 100)
        : 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatNumber = (amount) => {
        return new Intl.NumberFormat('id-ID').format(amount || 0);
    };

    const formatInputCurrency = (value) => {
        const num = value.replace(/\D/g, '');
        return num ? parseInt(num).toLocaleString('id-ID') : '';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getStatusLabel = (status) => {
        const labels = { 'completed': 'SELESAI', 'ongoing': 'BERJALAN', 'pending': 'RENCANA' };
        return labels[status] || status;
    };

    const getStatusClass = (status) => {
        const classes = { 'completed': 'status-selesai', 'ongoing': 'status-berjalan', 'pending': 'status-rencana' };
        return classes[status] || '';
    };

    // Get label for uraian id
    const getUraianLabel = (jenis, id) => {
        if (!id) return '-';
        const items = uraianData[jenis] || [];
        const found = items.find(u => u.id === parseInt(id));
        return found ? `${found.kode} ${found.nama}` : '-';
    };

    // Handlers
    const emptyForm = {
        title: '', description: '', deadline: '', budget: '', realization: '',
        rincianRealisasi: [],
        category: 'Belanja Barang', status: 'pending',
        programId: '', subProgramId: '', outputId: '', subOutputId: '',
        komponenId: '', subKomponenId: '', akunId: '', itemId: '',
    };

    const handleOpenAddModal = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setShowAddModal(true);
    };

    const handleOpenEditModal = (plan) => {
        setFormData({
            title: plan.title,
            description: plan.description || '',
            deadline: plan.deadline,
            budget: plan.budget.toString(),
            realization: (plan.realization || 0).toString(),
            rincianRealisasi: Array.isArray(plan.rincianRealisasi) ? plan.rincianRealisasi : [],
            category: plan.category || 'Belanja Barang',
            status: plan.status,
            programId: plan.programId || '',
            subProgramId: plan.subProgramId || '',
            outputId: plan.outputId || '',
            subOutputId: plan.subOutputId || '',
            komponenId: plan.komponenId || '',
            subKomponenId: plan.subKomponenId || '',
            akunId: plan.akunId || '',
            itemId: plan.itemId || '',
        });
        setEditingId(plan.id);
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingId(null);
        setFormData(emptyForm);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.deadline) {
            alert('Judul dan tanggal wajib diisi!');
            return;
        }

        const planData = {
            title: formData.title,
            description: formData.description,
            deadline: formData.deadline,
            budget: parseInt(formData.budget.replace(/\D/g, '')) || 0,
            realization: parseInt(formData.realization.replace(/\D/g, '')) || 0,
            rincianRealisasi: formData.rincianRealisasi || [],
            category: formData.category,
            status: formData.status,
            programId: formData.programId ? parseInt(formData.programId) : null,
            subProgramId: formData.subProgramId ? parseInt(formData.subProgramId) : null,
            outputId: formData.outputId ? parseInt(formData.outputId) : null,
            subOutputId: formData.subOutputId ? parseInt(formData.subOutputId) : null,
            komponenId: formData.komponenId ? parseInt(formData.komponenId) : null,
            subKomponenId: formData.subKomponenId ? parseInt(formData.subKomponenId) : null,
            akunId: formData.akunId ? parseInt(formData.akunId) : null,
            itemId: formData.itemId ? parseInt(formData.itemId) : null,
        };

        try {
            if (editingId) {
                await updateWorkPlan(sectionId, editingId, planData);
                showSaveStatus('[OK] Kegiatan berhasil diperbarui & disimpan ke database!');
            } else {
                await addWorkPlan(sectionId, planData);
                showSaveStatus('[OK] Kegiatan berhasil ditambahkan & disimpan ke database!');
            }
            await loadData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving work plan:', error);
            showSaveStatus('[ERROR] Gagal menyimpan ke database!');
        }
    };

    const handleDelete = async (planId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
            try {
                const success = await deleteWorkPlan(sectionId, planId);
                if (success) {
                    await loadData();
                    showSaveStatus('[OK] Kegiatan berhasil dihapus dari database!');
                } else {
                    throw new Error('Gagal menghapus');
                }
            } catch (error) {
                console.error('Error deleting work plan:', error);
                showSaveStatus('[ERROR] Gagal menghapus dari database!');
            }
        }
    };
    const handlePaguSave = async () => {
        try {
            await updateSectionPagu(sectionId, pagu);
            setIsEditingPagu(false);
            showSaveStatus('[OK] Pagu berhasil disimpan ke database!');
        } catch (error) {
            console.error('Error saving pagu:', error);
            showSaveStatus('[ERROR] Gagal menyimpan pagu!');
        }
    };

    // Rincian Realisasi handlers
    const handleAddRincian = () => {
        setFormData(prev => ({
            ...prev,
            rincianRealisasi: [...prev.rincianRealisasi, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random(), akunId: '', itemId: '', nominal: '0' }]
        }));
    };

    const handleRemoveRincian = (index) => {
        setFormData(prev => {
            const newRincian = [...prev.rincianRealisasi];
            newRincian.splice(index, 1);

            // Recalculate total realization
            const total = newRincian.reduce((sum, item) => sum + (parseInt(String(item.nominal).replace(/\D/g, '')) || 0), 0);
            return { ...prev, rincianRealisasi: newRincian, realization: total.toString() };
        });
    };

    const handleRincianChange = (index, field, value) => {
        setFormData(prev => {
            const newRincian = [...prev.rincianRealisasi];
            newRincian[index][field] = value;

            // Recalculate if nominal changed
            let newRealization = prev.realization;
            if (field === 'nominal') {
                newRealization = newRincian.reduce((sum, item) => sum + (parseInt(String(item.nominal).replace(/\D/g, '')) || 0), 0).toString();
            }
            return { ...prev, rincianRealisasi: newRincian, realization: newRealization };
        });
    };

    // === QUICK-ADD URAIAN ===
    const handleSaveUraian = async () => {
        if (!addUraianForm.kode.trim() || !addUraianForm.nama.trim()) return;
        setAddUraianLoading(true);
        try {
            const saved = await addUraianItem({
                kode: addUraianForm.kode.trim(),
                nama: addUraianForm.nama.trim(),
                jenis: addUraianForm.jenis,
                parentId: addUraianForm.parentId || null,
                urutan: 0,
            });
            if (!saved) throw new Error('Gagal menyimpan');

            // Reload uraian data
            await loadUraianData();

            // Auto-select the new item in the relevant formData field
            const fieldMap = {
                program: 'programId', sub_program: 'subProgramId',
                output: 'outputId', sub_output: 'subOutputId',
                komponen: 'komponenId', sub_komponen: 'subKomponenId',
                akun: 'akunId', item: 'itemId',
            };
            const field = fieldMap[addUraianForm.jenis];
            if (activeRincianAdd) {
                const { index, jenis } = activeRincianAdd;
                handleRincianChange(index, jenis === 'akun' ? 'akunId' : 'itemId', String(saved.id));
                setActiveRincianAdd(null);
            } else if (field) {
                setFormData(prev => ({ ...prev, [field]: String(saved.id) }));
            }

            setShowAddUraianModal(false);
            showSaveStatus(`[OK] ${JENIS_LABEL[addUraianForm.jenis]} "${addUraianForm.kode}" berhasil ditambahkan!`);
        } catch (err) {
            console.error('Error saving uraian:', err);
            showSaveStatus('[ERROR] Gagal menyimpan uraian!');
        } finally {
            setAddUraianLoading(false);
            setActiveRincianAdd(null);
        }
    };

    const handleDeleteUraian = async (id, jenis, nama) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${JENIS_LABEL[jenis]} "${nama}"? Data yang bergantung pada item ini mungkin akan terpengaruh.`)) {
            return;
        }

        try {
            const success = await deleteUraianItem(id);
            if (success) {
                // Reload uraian data
                await loadUraianData();

                // Unset the selected item in formData if it's the deleted item
                const fieldMap = {
                    program: 'programId', sub_program: 'subProgramId',
                    output: 'outputId', sub_output: 'subOutputId',
                    komponen: 'komponenId', sub_komponen: 'subKomponenId',
                    akun: 'akunId', item: 'itemId',
                };
                const field = fieldMap[jenis];
                if (formData[field] === String(id)) {
                    setFormData(prev => ({ ...prev, [field]: '' }));
                }

                showSaveStatus(`[OK] Data berhasil dihapus!`);
            } else {
                throw new Error('Gagal menghapus');
            }
        } catch (err) {
            console.error('Error deleting uraian:', err);
            showSaveStatus('[ERROR] Gagal menghapus data!');
        }
    };

    // === PRINT / DOWNLOAD REPORT ===
    const handlePrintReport = () => {
        const printContent = reportRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        const now = new Date();
        const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const periode = `Periode ${bulan[now.getMonth()]} ${now.getFullYear()}`;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan - ${sectionInfo.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 15mm 15mm 15mm 20mm; }
        .report-print-header { text-align: center; margin-bottom: 16px; }
        .report-print-header h1 { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-print-header p { font-size: 9px; margin-top: 3px; }
        .meta-table { width: 100%; margin-bottom: 10px; font-size: 9px; }
        .gov-meta-table td { padding: 1px 3px; vertical-align: top; }
        .gov-meta-table td:first-child { width: 110px; font-weight: normal; }
        .gov-meta-table td:nth-child(2) { width: 10px; }
        .gov-meta-table td:nth-child(3) { font-weight: bold; }
        .gov-hal { text-align: right; font-size: 9px; margin-bottom: 4px; }
        table.gov-table { width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #000; }
        table.gov-table th { background-color: #1e3a5f !important; color: #fff !important; padding: 5px 6px; text-align: center; border: 1px solid #777; font-weight: bold; }
        table.gov-table td { padding: 3px 6px; border: 1px solid #aaa; vertical-align: top; }
        table.gov-table tr.gov-row-jumlah td { background-color: #1e3a5f !important; color: #fff !important; font-weight: bold; }
        table.gov-table tr.gov-row-program td { background-color: #d0d8e8 !important; font-weight: bold; }
        table.gov-table tr.gov-row-sub-program td { background-color: #e8ecf3 !important; font-weight: normal; }
        table.gov-table tr.gov-row-output td { background-color: #fde68a !important; font-weight: bold; color: #b45309 !important; }
        table.gov-table tr.gov-row-sub-output td { background-color: #fef3c7 !important; font-weight: bold; color: #b45309 !important; }
        table.gov-table tr.gov-row-komponen td { background-color: #f0f9ff !important; font-weight: normal; }
        table.gov-table tr.gov-row-akun td { background-color: #fff !important; font-weight: bold; }
        table.gov-table tr.gov-row-item td { background-color: #fff !important; font-weight: normal; }
        table.gov-table tr.gov-row-rincian td { background-color: #fafafa !important; font-style: italic; color: #555 !important; }
        table.gov-table tr.gov-row-total td { background-color: #1e3a5f !important; color: #fff !important; font-weight: bold; }
        .gov-bold { font-weight: bold; }
        .gov-orange { color: #b45309 !important; font-weight: bold; }
        .gov-red { color: #cc0000 !important; }
        .td-num { text-align: right; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .indent-1 { padding-left: 16px !important; }
        .indent-2 { padding-left: 28px !important; }
        .indent-3 { padding-left: 40px !important; }
        .indent-4 { padding-left: 52px !important; }
        .indent-5 { padding-left: 64px !important; }
        .footer-note { margin-top: 10px; font-size: 8px; border-top: 1px solid #000; padding-top: 5px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
${printContent.innerHTML}
</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    // Simplified report data (no period filtering)
    const buildReportRows = () => {
        const processedPlans = workPlans.map(plan => ({
            ...plan,
            realization: parseFloat(plan.realization) || 0,
        }));

        const totalPaguKegiatan = workPlans.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalRealisasi = processedPlans.reduce((sum, p) => sum + p.realization, 0);
        const totalSisa = pagu - totalRealisasi;

        return {
            plans: processedPlans,
            totalPaguKegiatan,
            totalRealisasi,
            totalSisa
        };
    };

    const { plans, totalPaguKegiatan, totalRealisasi, totalSisa } = buildReportRows();

    return (
        <div className="section-content">
            {/* Save Status Toast */}
            {saveStatus && <div className="save-toast">{saveStatus}</div>}

            {/* Read-Only Warning Banner */}
            {!canEdit && (
                <div className="readonly-banner">
                    <div className="readonly-banner-content">
                        <span className="readonly-icon"><FlatIcon name="lock" size={16} /></span>
                        <div className="readonly-text">
                            <strong>Mode Hanya Baca</strong>
                            <p>Anda hanya memiliki izin untuk melihat data seksi ini. Hubungi Super Admin untuk mendapatkan izin edit.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="section-header-box">
                <div className="header-left">
                    <div className="header-icon-box">
                        <span className="icon-scale"><FlatIcon name="scale" size={22} color="#fff" /></span>
                    </div>
                    <div className="header-text-group">
                        <h1 className="header-title-white">{sectionInfo.title}</h1>
                        <p className="header-subtitle-orange">{sectionInfo.subtitle}</p>
                    </div>
                </div>
                <div className="header-right">
                    {canEdit && (
                        <div className="header-actions-new">
                            <button className="btn-edit-seksi">
                                <span><FlatIcon name="edit" size={14} /></span> Edit Seksi
                            </button>
                        </div>
                    )}
                    {!canEdit && (
                        <div className="header-actions-new">
                            <span className="readonly-badge"><FlatIcon name="eye" size={14} /> Hanya Baca</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Anggaran Seksi Section */}
            <div className="anggaran-section">
                <div className="anggaran-header">
                    <div className="anggaran-title">
                        <span className="coin-icon"><FlatIcon name="wallet" size={18} /></span>
                        <h2>Anggaran Seksi</h2>
                        <button className="btn-lihat-laporan" onClick={() => setShowReportModal(true)}>
                            <FlatIcon name="chart" size={14} /> Lihat Laporan
                        </button>
                    </div>
                    <span className="percentage-badge">{usedPercentage}% Terpakai</span>
                </div>

                <div className="anggaran-progress">
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${usedPercentage}%` }}></div>
                        <div className="progress-point" style={{ left: `${usedPercentage}%` }}></div>
                    </div>
                </div>

                <div className="budget-cards-row">
                    <div className="budget-card-item pagu">
                        <div className="card-label">Pagu</div>
                        {isEditingPagu && canEdit ? (
                            <div className="pagu-edit">
                                <input
                                    type="text"
                                    value={formatInputCurrency(pagu.toString())}
                                    onChange={(e) => setPagu(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                    placeholder="0"
                                />
                                <button className="btn-check" onClick={handlePaguSave}>✓</button>
                            </div>
                        ) : (
                            <div className="card-value">
                                {formatCurrency(pagu)}
                                {canEdit && (
                                    <button className="btn-edit-pagu" onClick={() => setIsEditingPagu(true)}><FlatIcon name="edit" size={12} /></button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="budget-card-item terpakai">
                        <div className="card-label">Terpakai</div>
                        <div className="card-value orange">{formatCurrency(terpakai)}</div>
                    </div>
                    <div className={`budget-card-item sisa-sementara ${sisaSementara < 0 ? 'negative' : ''}`}>
                        <div className="card-label">Sisa Sementara</div>
                        <div className={`card-value ${sisaSementara < 0 ? 'red' : 'blue'}`}>{formatCurrency(sisaSementara)}</div>
                        <div className="card-sub">Pagu − Pagu Kegiatan</div>
                    </div>
                    <div className={`budget-card-item sisa-bersih ${sisaBersih < 0 ? 'negative' : ''}`}>
                        <div className="card-label">Sisa Bersih</div>
                        <div className={`card-value ${sisaBersih < 0 ? 'red' : 'green'}`}>{formatCurrency(sisaBersih)}</div>
                        <div className="card-sub">Pagu − Total Realisasi</div>
                    </div>
                </div>
            </div>

            {/* Status Kegiatan Section */}
            <div className="status-kegiatan-section">
                <div className="status-kegiatan-header-title">
                    <span><FlatIcon name="chart" size={16} /> Status Kegiatan</span>
                </div>

                <div className="overall-progress-card">
                    <div className="progress-top">
                        <span className="progress-label">Progress Keseluruhan</span>
                        <span className="progress-percent">{completedPercentage}%</span>
                    </div>
                    <div className="progress-bar-main">
                        <div className="progress-bar-fill" style={{ width: `${completedPercentage}%` }}></div>
                    </div>
                    <div className="progress-footer">
                        <span>{statusCounts.completed} selesai</span>
                        <span>{workPlans.length} total</span>
                    </div>
                </div>

                {[
                    { key: 'completed', label: 'Selesai', icon: 'check', cls: 'green', border: 'green-border', icons: ['libra', 'search', 'traffic-light'] },
                    { key: 'ongoing', label: 'Sedang Berjalan', icon: 'refresh', cls: 'orange', border: 'orange-border', icons: ['search', 'folder', 'bolt'] },
                    { key: 'pending', label: 'Belum Mulai', icon: 'clipboard', cls: 'gray', border: 'gray-border', icons: ['scale', 'document', 'calendar'] },
                ].map(({ key, label, icon, cls, border, icons }) => (
                    <div key={key} className="status-group">
                        <div className="group-header">
                            <div className="group-title">
                                <span className={`group-icon-${key === 'completed' ? 'check' : key === 'ongoing' ? 'sync' : 'plan'}`}><FlatIcon name={icon} size={16} /></span>
                                <span>{label}</span>
                            </div>
                            <span className={`group-badge ${cls}`}>{statusCounts[key]}</span>
                        </div>
                        <div className="group-list">
                            {workPlans.filter(p => p.status === key).length > 0 ? (
                                workPlans.filter(p => p.status === key).map((plan, idx) => (
                                    <div key={`compact-${plan.id || idx}`} className={`compact-activity-card ${border}`}>
                                        <span className="card-icon"><FlatIcon name={icons[idx % 3]} size={14} /></span>
                                        <div className="card-info">
                                            <h4>{plan.title}</h4>
                                            <p>{sectionId.toUpperCase()} • {formatDate(plan.deadline)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-activity-text">Tidak ada kegiatan</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Rencana Kegiatan Header */}
            <div className="rencana-kegiatan-header">
                <div className="rk-left">
                    <h3>Rencana Kegiatan</h3>
                </div>
                <div className="rk-right">
                    <span className="activity-count-text">{workPlans.length} Kegiatan</span>
                    {canEdit && (
                        <button className="btn-tambah-new" onClick={handleOpenAddModal}>
                            <span>+</span> Tambah
                        </button>
                    )}
                </div>
            </div>

            {/* Work Plans List */}
            <div className="workplans-container">
                {workPlans.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon"><FlatIcon name="mailbox" size={32} /></span>
                        <p>Belum ada rencana kerja. Klik "Tambah" untuk menambahkan.</p>
                    </div>
                ) : (
                    workPlans.map((plan, idx) => (
                        <div key={`plan-${plan.id || idx}`} className="workplan-card">
                            <div className="workplan-content">
                                <div className="workplan-main">
                                    <h3>{plan.title}</h3>
                                    {plan.description && <p className="workplan-desc">{plan.description}</p>}
                                    {/* Uraian info on card */}
                                    {(plan.programId || plan.outputId || plan.komponenId) && (
                                        <div className="workplan-uraian-tags">
                                            {plan.programId && <span className="uraian-tag prog">{getUraianLabel('program', plan.programId)}</span>}
                                            {plan.outputId && <span className="uraian-tag out">{getUraianLabel('output', plan.outputId)}</span>}
                                            {plan.komponenId && <span className="uraian-tag komp">{getUraianLabel('komponen', plan.komponenId)}</span>}
                                        </div>
                                    )}
                                    <div className="workplan-meta">
                                        <span className="meta-date"><FlatIcon name="calendar" size={12} /> {formatDate(plan.deadline)}</span>
                                        <div className="meta-budgets">
                                            {plan.budget > 0 && (
                                                <span className="meta-budget">Pagu: {formatCurrency(plan.budget)}</span>
                                            )}
                                            {plan.status === 'completed' && (
                                                <span className="meta-realization">Realisasi: {formatCurrency(plan.realization || 0)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="workplan-actions">
                                    <span className={`status-badge ${getStatusClass(plan.status)}`}>
                                        {getStatusLabel(plan.status)}
                                    </span>
                                    {canEdit && (
                                        <div className="action-buttons">
                                            <button className="btn-action edit" onClick={() => handleOpenEditModal(plan)}>
                                                <FlatIcon name="edit" size={12} /> Edit
                                            </button>
                                            <button className="btn-action delete" onClick={() => handleDelete(plan.id)}>
                                                <FlatIcon name="trash" size={12} /> Hapus
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* =============== ADD/EDIT MODAL =============== */}
            {showAddModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header formal-header">
                            <div className="modal-title">
                                <h2>{editingId ? 'Edit Rencana Kerja' : 'Tambah Rencana Kerja'}</h2>
                            </div>
                            <button className="modal-close" onClick={handleCloseModal}>✕</button>
                        </div>
                        <div className="modal-body formal-body">
                            {/* BASIC INFO */}
                            <div className="form-section-title formal-section-title">Informasi Utama</div>
                            <div className="form-group">
                                <label>Judul</label>
                                <input
                                    type="text"
                                    placeholder="Masukkan judul kegiatan..."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <textarea
                                    placeholder="Masukkan deskripsi kegiatan..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="form-row-2col">
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status Pelaksanaan</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="formal-input"
                                    >
                                        <option value="pending">Belum Berjalan (Rencana)</option>
                                        <option value="ongoing">Sedang Berjalan</option>
                                        <option value="completed">Selesai</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row-2col">
                                <div className="form-group">
                                    <label>Anggaran Kegiatan (Pagu)</label>
                                    <div className="input-currency">
                                        <span className="currency-prefix">Rp</span>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={formatInputCurrency(formData.budget)}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Total Realisasi Anggaran</label>
                                    <div className="input-currency realization-input" style={formData.rincianRealisasi.length > 0 ? { backgroundColor: '#f1f5f9' } : {}}>
                                        <span className="currency-prefix">Rp</span>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={formatInputCurrency(formData.realization)}
                                            onChange={(e) => setFormData({ ...formData, realization: e.target.value })}
                                            disabled={formData.rincianRealisasi.length > 0}
                                        />
                                    </div>
                                    <small className="input-help">
                                        {formData.rincianRealisasi.length > 0
                                            ? "Dihitung otomatis dari rincian di bawah."
                                            : "Masukkan jumlah secara manual, atau tambah rincian di bawah."}
                                    </small>
                                </div>
                            </div>

                            {/* URAIAN SECTION */}
                            <div className="form-section-divider"></div>
                            <div className="form-section-title formal-section-title">Klasifikasi Uraian Anggaran
                                <span className="form-section-subtitle">Sesuaikan dengan mata anggaran terkait</span>
                            </div>

                            {/* Migration banner when table doesn't exist */}
                            {uraianTableMissing && (
                                <div className="migration-banner">
                                    <div className="migration-banner-icon"><FlatIcon name="warning" size={24} color="#f59e0b" /></div>
                                    <div className="migration-banner-content">
                                        <strong>Tabel Uraian Belum Dibuat</strong>
                                        <p>Jalankan SQL migration di Supabase untuk mengaktifkan fitur Uraian Anggaran.</p>
                                        <div className="migration-steps">
                                            <span className="migration-step">1</span>
                                            <span>Buka <a href="https://supabase.com/dashboard/project/sbhpbmwamqhxwisuqruq/sql/new" target="_blank" rel="noreferrer">Supabase SQL Editor</a></span>
                                        </div>
                                        <div className="migration-steps">
                                            <span className="migration-step">2</span>
                                            <span>Jalankan file <code>sql/add_uraian_tables.sql</code></span>
                                        </div>
                                        <div className="migration-steps">
                                            <span className="migration-step">3</span>
                                            <span>Refresh halaman ini</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`uraian-grid ${uraianTableMissing ? 'uraian-grid-disabled' : ''}`}>

                                {/* ---- Helper: render one uraian field ---- */}
                                {[
                                    {
                                        jenis: 'program', badgeCls: 'prog', label: 'Program',
                                        value: formData.programId,
                                        onChange: (v) => setFormData({ ...formData, programId: v, subProgramId: '', outputId: '', subOutputId: '', komponenId: '', subKomponenId: '', akunId: '', itemId: '' }),
                                        options: uraianData.program,
                                        parentId: null,
                                    },
                                    {
                                        jenis: 'sub_program', badgeCls: 'sub-prog', label: 'Sub-Program',
                                        value: formData.subProgramId,
                                        onChange: (v) => setFormData({ ...formData, subProgramId: v, outputId: '', subOutputId: '', komponenId: '', subKomponenId: '', akunId: '', itemId: '' }),
                                        options: uraianData.sub_program.filter(u => !formData.programId || u.parent_id === parseInt(formData.programId) || u.parent_id === null),
                                        parentId: formData.programId ? parseInt(formData.programId) : null,
                                    },
                                    {
                                        jenis: 'output', badgeCls: 'output', label: 'Output',
                                        value: formData.outputId,
                                        onChange: (v) => setFormData({ ...formData, outputId: v, subOutputId: '', komponenId: '', subKomponenId: '', akunId: '', itemId: '' }),
                                        options: uraianData.output.filter(u => !formData.subProgramId || u.parent_id === parseInt(formData.subProgramId) || u.parent_id === null),
                                        parentId: formData.subProgramId ? parseInt(formData.subProgramId) : null,
                                    },
                                    {
                                        jenis: 'sub_output', badgeCls: 'sub-output', label: 'Sub-Output',
                                        value: formData.subOutputId,
                                        onChange: (v) => setFormData({ ...formData, subOutputId: v, komponenId: '', subKomponenId: '', akunId: '', itemId: '' }),
                                        options: uraianData.sub_output.filter(u => !formData.outputId || u.parent_id === parseInt(formData.outputId) || u.parent_id === null),
                                        parentId: formData.outputId ? parseInt(formData.outputId) : null,
                                    },
                                    {
                                        jenis: 'komponen', badgeCls: 'komponen', label: 'Komponen',
                                        value: formData.komponenId,
                                        onChange: (v) => setFormData({ ...formData, komponenId: v, subKomponenId: '', akunId: '', itemId: '' }),
                                        options: uraianData.komponen.filter(u => !formData.subOutputId || u.parent_id === parseInt(formData.subOutputId) || u.parent_id === null),
                                        parentId: formData.subOutputId ? parseInt(formData.subOutputId) : null,
                                    },
                                    {
                                        jenis: 'sub_komponen', badgeCls: 'sub-komponen', label: 'Sub-Komponen',
                                        value: formData.subKomponenId,
                                        onChange: (v) => setFormData({ ...formData, subKomponenId: v, akunId: '', itemId: '' }),
                                        options: uraianData.sub_komponen.filter(u => !formData.komponenId || u.parent_id === parseInt(formData.komponenId) || u.parent_id === null),
                                        parentId: formData.komponenId ? parseInt(formData.komponenId) : null,
                                    }
                                ].map(({ jenis, badgeCls, label, value, onChange, options, parentId }) => (
                                    <div key={jenis} className="form-group uraian-field">
                                        <div className="uraian-label-row">
                                            <span className={`uraian-badge ${badgeCls}`}>{label}</span>
                                            <div className="uraian-action-btns">
                                                {value && (
                                                    <button
                                                        type="button"
                                                        className="btn-delete-uraian"
                                                        title={`Hapus data yang dipilih`}
                                                        onClick={() => {
                                                            const item = options.find(u => u.id == value);
                                                            if (item) handleDeleteUraian(item.id, jenis, item.nama);
                                                        }}
                                                    >
                                                        <FlatIcon name="trash" size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn-add-uraian"
                                                    title={`Tambah ${label} baru`}
                                                    onClick={() => {
                                                        setAddUraianForm({ jenis, kode: '', nama: '', parentId });
                                                        setShowAddUraianModal(true);
                                                    }}
                                                >
                                                    + Tambah
                                                </button>
                                            </div>
                                        </div>
                                        <select value={value} onChange={(e) => onChange(e.target.value)}>
                                            <option value="">— Pilih {label} —</option>
                                            {options.map((u, idx) => (
                                                <option key={`opt-${jenis}-${u.id || idx}`} value={u.id}>[{u.kode}] {u.nama}</option>
                                            ))}
                                        </select>
                                        {options.length === 0 && (
                                            <small className="input-help-empty">Belum ada data — klik <strong>+ Tambah</strong> untuk menambahkan.</small>
                                        )}
                                    </div>
                                ))}

                            </div>

                            {/* ========= RINCIAN REALISASI ITEM ========= */}
                            <div className="form-section-divider"></div>
                            <div className="form-section-title formal-section-title">
                                Rincian Realisasi per Item
                                <span className="form-section-subtitle">Daftar nominal realisasi terperinci</span>
                            </div>

                            <div className="rincian-realisasi-container">
                                {formData.rincianRealisasi.map((item, index) => {
                                    const availableAkun = uraianData.akun.filter(u => !formData.subKomponenId || u.parent_id === parseInt(formData.subKomponenId) || u.parent_id === null);
                                    const availableItem = uraianData.item.filter(u => !item.akunId || u.parent_id === parseInt(item.akunId) || u.parent_id === null);

                                    return (
                                        <div key={item.id || index} className="rincian-row-wrapper">
                                            <div className="rincian-row">
                                                {/* Akun with Actions */}
                                                <div className="rincian-field-with-actions">
                                                    <select
                                                        className="rincian-select"
                                                        value={item.akunId || ''}
                                                        onChange={(e) => handleRincianChange(index, 'akunId', e.target.value)}
                                                    >
                                                        <option value="">— Pilih Akun —</option>
                                                        {availableAkun.map((u, oIdx) => <option key={`akun-${item.id}-${u.id || oIdx}`} value={u.id}>[{u.kode}] {u.nama}</option>)}
                                                    </select>
                                                    <div className="rincian-mini-actions">
                                                        <button type="button" className="btn-mini-add" title="Tambah Akun" onClick={() => {
                                                            setActiveRincianAdd({ index, jenis: 'akun' });
                                                            setAddUraianForm({ jenis: 'akun', kode: '', nama: '', parentId: formData.subKomponenId ? parseInt(formData.subKomponenId) : null });
                                                            setShowAddUraianModal(true);
                                                        }}>+</button>
                                                        {item.akunId && (
                                                            <button type="button" className="btn-mini-del" title="Hapus Akun" onClick={() => {
                                                                const itm = availableAkun.find(u => u.id == item.akunId);
                                                                if (itm) handleDeleteUraian(itm.id, 'akun', itm.nama);
                                                            }}><FlatIcon name="trash" size={12} /></button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Item with Actions */}
                                                <div className="rincian-field-with-actions">
                                                    <select
                                                        className="rincian-select"
                                                        value={item.itemId || ''}
                                                        onChange={(e) => handleRincianChange(index, 'itemId', e.target.value)}
                                                    >
                                                        <option value="">— Pilih Item —</option>
                                                        {availableItem.map((u, oIdx) => <option key={`item-${item.id}-${u.id || oIdx}`} value={u.id}>[{u.kode}] {u.nama}</option>)}
                                                    </select>
                                                    <div className="rincian-mini-actions">
                                                        <button type="button" className="btn-mini-add" title="Tambah Item" onClick={() => {
                                                            setActiveRincianAdd({ index, jenis: 'item' });
                                                            setAddUraianForm({ jenis: 'item', kode: '', nama: '', parentId: item.akunId ? parseInt(item.akunId) : null });
                                                            setShowAddUraianModal(true);
                                                        }}>+</button>
                                                        {item.itemId && (
                                                            <button type="button" className="btn-mini-del" title="Hapus Item" onClick={() => {
                                                                const itm = availableItem.find(u => u.id == item.itemId);
                                                                if (itm) handleDeleteUraian(itm.id, 'item', itm.nama);
                                                            }}><FlatIcon name="trash" size={12} /></button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="input-currency rincian-nominal" style={{ width: '180px' }}>
                                                    <span className="currency-prefix">Rp</span>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={formatInputCurrency(String(item.nominal))}
                                                        onChange={(e) => handleRincianChange(index, 'nominal', e.target.value)}
                                                    />
                                                </div>
                                                <button className="btn-delete-rincian" onClick={() => handleRemoveRincian(index)}>✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button className="btn-add-rincian" onClick={handleAddRincian}>
                                    + Tambah Pengeluaran
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-batal" onClick={handleCloseModal}>Batal</button>
                            <button className="btn-submit" onClick={handleSubmit}>
                                {editingId ? 'Simpan' : 'Tambah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =============== QUICK-ADD URAIAN MINI MODAL =============== */}
            {showAddUraianModal && (
                <div className="modal-overlay uraian-mini-overlay" onClick={() => setShowAddUraianModal(false)}>
                    <div className="uraian-mini-modal" onClick={e => e.stopPropagation()}>
                        <div className="uraian-mini-header">
                            <div className="uraian-mini-title">
                                <span className={`uraian-badge ${{
                                    program: 'prog', sub_program: 'sub-prog', output: 'output',
                                    sub_output: 'sub-output', komponen: 'komponen', sub_komponen: 'sub-komponen',
                                    akun: 'akun', item: 'item'
                                }[addUraianForm.jenis]}`}>
                                    {JENIS_LABEL[addUraianForm.jenis]}
                                </span>
                                <span className="uraian-mini-heading">Tambah {JENIS_LABEL[addUraianForm.jenis]} Baru</span>
                            </div>
                            <button className="modal-close" onClick={() => setShowAddUraianModal(false)}>✕</button>
                        </div>

                        <div className="uraian-mini-body">
                            {addUraianForm.parentId && (
                                <div className="uraian-mini-parent-info">
                                    <span><FlatIcon name="pin" size={14} /> Akan ditambah sebagai turunan dari item yang dipilih di atasnya</span>
                                </div>
                            )}
                            <div className="uraian-mini-row">
                                <div className="form-group" style={{ flex: '0 0 140px', marginBottom: 0 }}>
                                    <label>Kode</label>
                                    <input
                                        type="text"
                                        placeholder="mis. BF.6161"
                                        value={addUraianForm.kode}
                                        onChange={e => setAddUraianForm({ ...addUraianForm, kode: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label>Nama / Uraian</label>
                                    <input
                                        type="text"
                                        placeholder={`Masukkan nama ${JENIS_LABEL[addUraianForm.jenis]}...`}
                                        value={addUraianForm.nama}
                                        onChange={e => setAddUraianForm({ ...addUraianForm, nama: e.target.value })}
                                        onKeyDown={async e => { if (e.key === 'Enter') await handleSaveUraian(); }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="uraian-mini-footer">
                            <button className="btn-batal" onClick={() => setShowAddUraianModal(false)}>Batal</button>
                            <button
                                className="btn-submit"
                                onClick={handleSaveUraian}
                                disabled={addUraianLoading || !addUraianForm.kode.trim() || !addUraianForm.nama.trim()}
                            >
                                {addUraianLoading ? <><FlatIcon name="hourglass" size={14} /> Menyimpan...</> : <><FlatIcon name="check" size={14} /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =============== REPORT MODAL =============== */}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content report-modal report-modal-gov" onClick={(e) => e.stopPropagation()}>
                        {/* Report Modal Top Bar */}
                        <div className="report-topbar">
                            <div className="report-topbar-left">
                                <span className="report-topbar-icon"><FlatIcon name="chart" size={20} color="#fff" /></span>
                                <div>
                                    <div className="report-topbar-title">Laporan Keuangan</div>
                                    <div className="report-topbar-sub">Seksi {sectionInfo.title}</div>
                                </div>
                            </div>
                            <div className="report-topbar-actions">
                                <button className="btn-report-action print" onClick={handlePrintReport} title="Cetak Laporan">
                                    <FlatIcon name="print" size={14} /> Cetak / Unduh
                                </button>
                                <button className="modal-close" onClick={() => setShowReportModal(false)}>✕</button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="report-tabs">
                            <button className={`tab-btn ${reportTab === 'ringkasan' ? 'active' : ''}`} onClick={() => setReportTab('ringkasan')}>
                                <FlatIcon name="clipboard" size={14} /> Ringkasan
                            </button>
                            <button className={`tab-btn ${reportTab === 'detail' ? 'active' : ''}`} onClick={() => setReportTab('detail')}>
                                <FlatIcon name="document" size={14} /> Detail Kegiatan
                            </button>
                        </div>

                        <div className="report-body">
                            {reportTab === 'ringkasan' ? (
                                <>
                                    <div className="summary-cards">
                                        <div className="summary-card blue">
                                            <div className="summary-label">Total Anggaran Seksi</div>
                                            <div className="summary-value">{formatCurrency(pagu)}</div>
                                        </div>
                                        <div className="summary-card yellow">
                                            <div className="summary-label">Total Dikeluarkan</div>
                                            <div className="summary-value">{formatCurrency(terpakai)}</div>
                                        </div>
                                        <div className="summary-card green">
                                            <div className="summary-label">Sisa Anggaran</div>
                                            <div className="summary-value">{formatCurrency(sisa)}</div>
                                        </div>
                                        <div className="summary-card white">
                                            <div className="summary-label">Rasio Penggunaan</div>
                                            <div className="summary-value ratio">{usedPercentage}%</div>
                                        </div>
                                    </div>
                                    <div className="status-allocation">
                                        <h3><FlatIcon name="chart" size={16} /> Alokasi Berdasarkan Status</h3>
                                        <div className="allocation-cards">
                                            <div className="allocation-card selesai">
                                                <div className="allocation-header">Selesai</div>
                                                <div className="allocation-amount">{formatCurrency(workPlans.filter(wp => wp.status === 'completed').reduce((sum, wp) => sum + wp.budget, 0))}</div>
                                                <div className="allocation-count">{statusCounts.completed} kegiatan</div>
                                            </div>
                                            <div className="allocation-card berjalan">
                                                <div className="allocation-header">Berjalan</div>
                                                <div className="allocation-amount">{formatCurrency(workPlans.filter(wp => wp.status === 'ongoing').reduce((sum, wp) => sum + wp.budget, 0))}</div>
                                                <div className="allocation-count">{statusCounts.ongoing} kegiatan</div>
                                            </div>
                                            <div className="allocation-card rencana">
                                                <div className="allocation-header">Rencana</div>
                                                <div className="allocation-amount">{formatCurrency(workPlans.filter(wp => wp.status === 'pending').reduce((sum, wp) => sum + wp.budget, 0))}</div>
                                                <div className="allocation-count">{statusCounts.pending} kegiatan</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="progress-section">
                                        <h3><FlatIcon name="trend-up" size={16} /> Progress Anggaran</h3>
                                        <div className="progress-bar-container">
                                            <div className="progress-bar-full">
                                                <div className="progress-used" style={{ width: `${usedPercentage}%` }}></div>
                                            </div>
                                            <div className="progress-labels">
                                                <span>{usedPercentage}% Terpakai</span>
                                                <span>{100 - usedPercentage}% Tersisa</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* ===== FORMAL GOVERNMENT REPORT STYLE ===== */
                                <div className="gov-report-wrapper">
                                    {/* This ref is used for printing */}
                                    <div ref={reportRef} className="gov-report-print-area">
                                        <div className="gov-report-header">
                                            <h1>LAPORAN KETERSEDIAAN DANA DETAIL TA {now.getFullYear()}</h1>
                                            <p>Per Program; Kegiatan; Output; SubOutput; Komponen; SubKomponen; Akun; Item;</p>
                                        </div>

                                        <div className="gov-meta-table">
                                            <table>
                                                <tbody>
                                                    <tr>
                                                        <td>Kementerian</td>
                                                        <td>:</td>
                                                        <td><strong>137</strong></td>
                                                        <td><strong>KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN</strong></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Unit Organisasi</td>
                                                        <td>:</td>
                                                        <td><strong>03</strong></td>
                                                        <td><strong>DIREKTORAT JENDERAL IMIGRASI</strong></td>
                                                    </tr>
                                                    <tr>
                                                        <td>Satuan Kerja</td>
                                                        <td>:</td>
                                                        <td><strong>692818</strong></td>
                                                        <td><strong>KANTOR IMIGRASI KELAS II TPI PEMATANG SIANTAR</strong></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div className="gov-hal">Hal 1 dari 1</div>
                                        </div>

                                        {/* Main Data Table */}
                                        <div className="gov-table-scroll">
                                            <table className="gov-table">
                                                <thead>
                                                    <tr>
                                                        <th className="th-uraian">Uraian</th>
                                                        <th className="th-pagu">Pagu Revisi</th>
                                                        <th className="th-lock">Lock Pagu</th>
                                                        <th className="th-realisasi">Realisasi TA {now.getFullYear()}</th>
                                                        <th className="th-persentase">% Anggaran</th>
                                                        <th className="th-sisa">SISA ANGGARAN</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* JUMLAH SELURUHNYA row */}
                                                    <tr className="gov-row-jumlah">
                                                        <td className="td-uraian gov-bold">JUMLAH SELURUHNYA</td>
                                                        <td className="td-num gov-bold">{formatNumber(pagu)}</td>
                                                        <td className="td-num">0</td>
                                                        <td className="td-num gov-bold">{formatNumber(totalRealisasi)}</td>
                                                        <td className="td-num gov-bold">{pagu > 0 ? ((totalRealisasi / pagu) * 100).toFixed(2) : '0.00'}%</td>
                                                        <td className="td-num gov-bold">{formatNumber(totalSisa)}</td>
                                                    </tr>

                                                    {/* Group by Program → Sub-Program → Output → Sub-Output → Komponen → Activity */}
                                                    {(() => {
                                                        // Helper: group array by a key function
                                                        const groupBy = (arr, keyFn) => {
                                                            const groups = {};
                                                            arr.forEach(item => {
                                                                const key = keyFn(item) || '__none__';
                                                                if (!groups[key]) groups[key] = [];
                                                                groups[key].push(item);
                                                            });
                                                            return groups;
                                                        };

                                                        // Aggregate helpers
                                                        const sumPagu = (arr) => arr.reduce((s, p) => s + (p.budget || 0), 0);
                                                        const sumReal = (arr) => arr.reduce((s, p) => s + (parseFloat(p.realization) || 0), 0);

                                                        const rows = [];

                                                        // --- Level 1: Group by Program ---
                                                        const progGroups = groupBy(plans, p => p.programId);
                                                        Object.entries(progGroups).forEach(([progKey, progPlans]) => {
                                                            const progItem = progKey !== '__none__' ? uraianData.program.find(u => u.id === parseInt(progKey)) : null;
                                                            const pPagu = sumPagu(progPlans);
                                                            const pReal = sumReal(progPlans);

                                                            if (progItem) {
                                                                rows.push(
                                                                    <tr key={`prog-${progKey}`} className="gov-row-program">
                                                                        <td className="td-uraian gov-bold">{progItem.kode} &nbsp; {progItem.nama}</td>
                                                                        <td className="td-num">{formatNumber(pPagu)}</td>
                                                                        <td className="td-num">0</td>
                                                                        <td className="td-num">{formatNumber(pReal)}</td>
                                                                        <td className="td-num">{pPagu > 0 ? ((pReal / pPagu) * 100).toFixed(2) : '0.00'}%</td>
                                                                        <td className="td-num">{formatNumber(pPagu - pReal)}</td>
                                                                    </tr>
                                                                );
                                                            }

                                                            // --- Level 2: Group by Sub-Program ---
                                                            const subProgGroups = groupBy(progPlans, p => p.subProgramId);
                                                            Object.entries(subProgGroups).forEach(([spKey, spPlans]) => {
                                                                const spItem = spKey !== '__none__' ? uraianData.sub_program.find(u => u.id === parseInt(spKey)) : null;
                                                                const spPagu = sumPagu(spPlans);
                                                                const spReal = sumReal(spPlans);

                                                                if (spItem) {
                                                                    rows.push(
                                                                        <tr key={`subprog-${spKey}`} className="gov-row-sub-program">
                                                                            <td className="td-uraian indent-1">{spItem.kode} &nbsp; {spItem.nama}</td>
                                                                            <td className="td-num">{formatNumber(spPagu)}</td>
                                                                            <td className="td-num">0</td>
                                                                            <td className="td-num">{formatNumber(spReal)}</td>
                                                                            <td className="td-num">{spPagu > 0 ? ((spReal / spPagu) * 100).toFixed(2) : '0.00'}%</td>
                                                                            <td className="td-num">{formatNumber(spPagu - spReal)}</td>
                                                                        </tr>
                                                                    );
                                                                }

                                                                // --- Level 3: Group by Output ---
                                                                const outGroups = groupBy(spPlans, p => p.outputId);
                                                                Object.entries(outGroups).forEach(([outKey, outPlans]) => {
                                                                    const outItem = outKey !== '__none__' ? uraianData.output.find(u => u.id === parseInt(outKey)) : null;
                                                                    const oPagu = sumPagu(outPlans);
                                                                    const oReal = sumReal(outPlans);

                                                                    if (outItem) {
                                                                        rows.push(
                                                                            <tr key={`out-${outKey}`} className="gov-row-output">
                                                                                <td className="td-uraian indent-2 gov-output-label">{outItem.kode} &nbsp; {outItem.nama}</td>
                                                                                <td className="td-num gov-orange">{formatNumber(oPagu)}</td>
                                                                                <td className="td-num gov-orange">0</td>
                                                                                <td className="td-num gov-orange">{formatNumber(oReal)}</td>
                                                                                <td className="td-num gov-orange">{oPagu > 0 ? ((oReal / oPagu) * 100).toFixed(2) : '0.00'}%</td>
                                                                                <td className="td-num gov-orange">{formatNumber(oPagu - oReal)}</td>
                                                                            </tr>
                                                                        );
                                                                    }

                                                                    // --- Level 4: Group by Sub-Output ---
                                                                    const soGroups = groupBy(outPlans, p => p.subOutputId);
                                                                    Object.entries(soGroups).forEach(([soKey, soPlans]) => {
                                                                        const soItem = soKey !== '__none__' ? uraianData.sub_output.find(u => u.id === parseInt(soKey)) : null;
                                                                        const soPagu = sumPagu(soPlans);
                                                                        const soReal = sumReal(soPlans);

                                                                        if (soItem) {
                                                                            rows.push(
                                                                                <tr key={`subout-${soKey}`} className="gov-row-sub-output">
                                                                                    <td className="td-uraian indent-2 gov-output-label">{soItem.kode} &nbsp; {soItem.nama}</td>
                                                                                    <td className="td-num gov-orange">{formatNumber(soPagu)}</td>
                                                                                    <td className="td-num gov-orange">0</td>
                                                                                    <td className="td-num gov-orange">{formatNumber(soReal)}</td>
                                                                                    <td className="td-num gov-orange">{soPagu > 0 ? ((soReal / soPagu) * 100).toFixed(2) : '0.00'}%</td>
                                                                                    <td className="td-num gov-orange">{formatNumber(soPagu - soReal)}</td>
                                                                                </tr>
                                                                            );
                                                                        }

                                                                        // --- Level 5: Group by Komponen ---
                                                                        const kompGroups = groupBy(soPlans, p => p.komponenId);
                                                                        Object.entries(kompGroups).forEach(([kompKey, kompPlans]) => {
                                                                            const kompItem = kompKey !== '__none__' ? uraianData.komponen.find(u => u.id === parseInt(kompKey)) : null;
                                                                            const kPagu = sumPagu(kompPlans);
                                                                            const kReal = sumReal(kompPlans);

                                                                            if (kompItem) {
                                                                                rows.push(
                                                                                    <tr key={`komp-${kompKey}`} className="gov-row-komponen">
                                                                                        <td className="td-uraian indent-3">{kompItem.kode} &nbsp; {kompItem.nama}</td>
                                                                                        <td className="td-num">{formatNumber(kPagu)}</td>
                                                                                        <td className="td-num">0</td>
                                                                                        <td className="td-num">{formatNumber(kReal)}</td>
                                                                                        <td className="td-num">{kPagu > 0 ? ((kReal / kPagu) * 100).toFixed(2) : '0.00'}%</td>
                                                                                        <td className="td-num">{formatNumber(kPagu - kReal)}</td>
                                                                                    </tr>
                                                                                );
                                                                            }

                                                                            // --- Level 6: Individual activity rows ---
                                                                            kompPlans.forEach((plan) => {
                                                                                const subKompItem = plan.subKomponenId ? uraianData.sub_komponen.find(u => u.id === plan.subKomponenId) : null;
                                                                                const akunItem = plan.akunId ? uraianData.akun.find(u => u.id === plan.akunId) : null;
                                                                                const itemItm = plan.itemId ? uraianData.item.find(u => u.id === plan.itemId) : null;
                                                                                const planReal = parseFloat(plan.realization) || 0;

                                                                                // Item / Activity row
                                                                                rows.push(
                                                                                    <tr key={`item-${plan.id}`} className="gov-row-item">
                                                                                        <td className="td-uraian indent-4">
                                                                                            {subKompItem ? `${subKompItem.kode} ` : ''}{itemItm ? `${itemItm.kode} ` : ''}{plan.title}
                                                                                        </td>
                                                                                        <td className="td-num">{formatNumber(plan.budget)}</td>
                                                                                        <td className="td-num">0</td>
                                                                                        <td className="td-num">{formatNumber(planReal)}</td>
                                                                                        <td className="td-num">{plan.budget > 0 ? ((planReal / plan.budget) * 100).toFixed(2) : '0.00'}%</td>
                                                                                        <td className={`td-num ${plan.budget - planReal < 0 ? 'gov-red' : ''}`}>{formatNumber(plan.budget - planReal)}</td>
                                                                                    </tr>
                                                                                );

                                                                                // Rincian Akun/Item — grouped by Akun
                                                                                const rincianArr = Array.isArray(plan.rincianRealisasi)
                                                                                    ? plan.rincianRealisasi
                                                                                    : (typeof plan.rincianRealisasi === 'string' ? (() => { try { return JSON.parse(plan.rincianRealisasi); } catch { return []; } })() : []);
                                                                                if (rincianArr && rincianArr.length > 0) {
                                                                                    // Group rincian by akunId
                                                                                    const akunGroups = {};
                                                                                    rincianArr.forEach(rincian => {
                                                                                        const akunKey = rincian.akunId || '__no_akun__';
                                                                                        if (!akunGroups[akunKey]) akunGroups[akunKey] = [];
                                                                                        akunGroups[akunKey].push(rincian);
                                                                                    });

                                                                                    Object.entries(akunGroups).forEach(([akunKey, items]) => {
                                                                                        const rAkun = akunKey !== '__no_akun__' ? uraianData.akun.find(u => u.id === parseInt(akunKey)) : null;
                                                                                        // Calculate akun group total
                                                                                        const akunTotal = items.reduce((sum, r) => {
                                                                                            const ns = typeof r.nominal === 'string' ? r.nominal.replace(/\D/g, '') : r.nominal;
                                                                                            return sum + (parseInt(ns) || 0);
                                                                                        }, 0);

                                                                                        // Akun header row
                                                                                        if (rAkun) {
                                                                                            rows.push(
                                                                                                <tr key={`rincian-akun-${plan.id}-${akunKey}`} className="gov-row-rincian-akun">
                                                                                                    <td className="td-uraian indent-5" style={{ fontWeight: 600, color: '#555' }}>
                                                                                                        [{rAkun.kode}] {rAkun.nama}
                                                                                                    </td>
                                                                                                    <td className="td-num">-</td>
                                                                                                    <td className="td-num">-</td>
                                                                                                    <td className="td-num" style={{ fontWeight: 600 }}>{formatNumber(akunTotal)}</td>
                                                                                                    <td className="td-num">-</td>
                                                                                                    <td className="td-num">-</td>
                                                                                                </tr>
                                                                                            );
                                                                                        }

                                                                                        // Item rows under this akun
                                                                                        items.forEach(rincian => {
                                                                                            const rItem = rincian.itemId ? uraianData.item.find(u => u.id === parseInt(rincian.itemId)) : null;
                                                                                            const nominalStr = typeof rincian.nominal === 'string' ? rincian.nominal.replace(/\D/g, '') : rincian.nominal;
                                                                                            const nominal = parseInt(nominalStr) || 0;

                                                                                            if (rItem) {
                                                                                                rows.push(
                                                                                                    <tr key={`rincian-${rincian.id}`} className="gov-row-rincian">
                                                                                                        <td className="td-uraian indent-6">
                                                                                                            <span style={{ color: '#888' }}>↳ [{rItem.kode}] {rItem.nama}</span>
                                                                                                        </td>
                                                                                                        <td className="td-num">-</td>
                                                                                                        <td className="td-num">-</td>
                                                                                                        <td className="td-num">{formatNumber(nominal)}</td>
                                                                                                        <td className="td-num">-</td>
                                                                                                        <td className="td-num">-</td>
                                                                                                    </tr>
                                                                                                );
                                                                                            }
                                                                                        });
                                                                                    });
                                                                                }
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });

                                                        return rows;
                                                    })()}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="gov-row-total">
                                                        <td className="td-uraian gov-bold">TOTAL ({workPlans.length} Kegiatan)</td>
                                                        <td className="td-num gov-bold">{formatNumber(totalPaguKegiatan)}</td>
                                                        <td className="td-num gov-bold">0</td>
                                                        <td className="td-num gov-bold">{formatNumber(totalRealisasi)}</td>
                                                        <td className="td-num gov-bold">{totalPaguKegiatan > 0 ? ((totalRealisasi / totalPaguKegiatan) * 100).toFixed(2) : '0.00'}%</td>
                                                        <td className="td-num gov-bold">{formatNumber(pagu - totalRealisasi)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className="gov-footnote">
                                            *Lock Pagu adalah jumlah pagu yang sedang dalam proses usulan revisi DIPA atau POK. Lock pagu akan hilang setelah usulan revisi DIPA/POK selesai menjadi DIPA.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionContent;
