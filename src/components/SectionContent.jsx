import { useState, useEffect } from 'react';
import { getWorkPlans, addWorkPlan, updateWorkPlan, deleteWorkPlan, getSectionPagu, updateSectionPagu } from '../utils/storage';
import './SectionContent.css';

const SectionContent = ({ sectionId, sectionInfo }) => {
    const [workPlans, setWorkPlans] = useState([]);
    const [pagu, setPagu] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [reportTab, setReportTab] = useState('ringkasan');
    const [isEditingPagu, setIsEditingPagu] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        budget: '',
        realization: '',
        category: 'Belanja Barang',
        status: 'pending'
    });

    // Load data on mount
    useEffect(() => {
        loadData();
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

    const showSaveStatus = (message) => {
        setSaveStatus(message);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    // Calculate budget based on manual realization input
    const terpakai = workPlans.reduce((sum, wp) => sum + (wp.realization || 0), 0);
    const sisa = pagu - terpakai;
    const usedPercentage = pagu > 0 ? Math.round((terpakai / pagu) * 100) : 0;

    // Status counts
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
        }).format(amount);
    };

    const formatInputCurrency = (value) => {
        const num = value.replace(/\D/g, '');
        return num ? parseInt(num).toLocaleString('id-ID') : '';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getStatusLabel = (status) => {
        const labels = {
            'completed': 'SELESAI',
            'ongoing': 'BERJALAN',
            'pending': 'RENCANA'
        };
        return labels[status] || status;
    };

    const getStatusClass = (status) => {
        const classes = {
            'completed': 'status-selesai',
            'ongoing': 'status-berjalan',
            'pending': 'status-rencana'
        };
        return classes[status] || '';
    };

    // Handlers
    const handleOpenAddModal = () => {
        setFormData({
            title: '',
            description: '',
            deadline: '',
            budget: '',
            realization: '',
            category: 'Belanja Barang',
            status: 'pending'
        });
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
            category: plan.category || 'Belanja Barang',
            status: plan.status
        });
        setEditingId(plan.id);
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingId(null);
        setFormData({
            title: '',
            description: '',
            deadline: '',
            budget: '',
            realization: '',
            category: 'Belanja Barang',
            status: 'pending'
        });
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
            category: formData.category,
            status: formData.status
        };

        try {
            if (editingId) {
                await updateWorkPlan(sectionId, editingId, planData);
                showSaveStatus('✅ Kegiatan berhasil diperbarui & disimpan ke database!');
            } else {
                await addWorkPlan(sectionId, planData);
                showSaveStatus('✅ Kegiatan berhasil ditambahkan & disimpan ke database!');
            }

            await loadData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving work plan:', error);
            showSaveStatus('❌ Gagal menyimpan ke database!');
        }
    };

    const handleDelete = async (planId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
            try {
                await deleteWorkPlan(sectionId, planId);
                await loadData();
                showSaveStatus('🗑️ Kegiatan berhasil dihapus dari database!');
            } catch (error) {
                console.error('Error deleting work plan:', error);
                showSaveStatus('❌ Gagal menghapus dari database!');
            }
        }
    };

    const handlePaguSave = async () => {
        try {
            await updateSectionPagu(sectionId, pagu);
            setIsEditingPagu(false);
            showSaveStatus('✅ Pagu berhasil disimpan ke database!');
        } catch (error) {
            console.error('Error saving pagu:', error);
            showSaveStatus('❌ Gagal menyimpan pagu!');
        }
    };

    return (
        <div className="section-content">
            {/* Save Status Toast */}
            {saveStatus && (
                <div className="save-toast">
                    {saveStatus}
                </div>
            )}

            {/* Header */}
            {/* Header Biru Gelap (Kembali ke desain sebelumnya) */}
            <div className="section-header-box">
                <div className="header-left">
                    <div className="header-icon-box">
                        <span className="icon-scale">⚖️</span>
                    </div>
                    <div className="header-text-group">
                        <h1 className="header-title-white">{sectionInfo.title}</h1>
                        <p className="header-subtitle-orange">{sectionInfo.subtitle}</p>
                    </div>
                </div>
                <div className="header-right">
                    <div className="header-actions-new">
                        <button className="btn-edit-seksi">
                            <span>✏️</span> Edit Seksi
                        </button>
                    </div>
                </div>
            </div>

            {/* Anggaran Seksi Section */}
            <div className="anggaran-section">
                <div className="anggaran-header">
                    <div className="anggaran-title">
                        <span className="coin-icon">💰</span>
                        <h2>Anggaran Seksi</h2>
                        <button className="btn-lihat-laporan" onClick={() => setShowReportModal(true)}>
                            📊 Lihat Laporan
                        </button>
                    </div>
                    <span className="percentage-badge">{usedPercentage}% Terpakai</span>
                </div>

                {/* Progress Bar */}
                <div className="anggaran-progress">
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${usedPercentage}%` }}></div>
                        <div className="progress-point" style={{ left: `${usedPercentage}%` }}></div>
                    </div>
                </div>

                {/* Budget Cards */}
                <div className="budget-cards-row">
                    <div className="budget-card-item pagu">
                        <div className="card-label">Pagu</div>
                        {isEditingPagu ? (
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
                                <button className="btn-edit-pagu" onClick={() => setIsEditingPagu(true)}>✏️</button>
                            </div>
                        )}
                    </div>
                    <div className="budget-card-item terpakai">
                        <div className="card-label">Terpakai</div>
                        <div className="card-value orange">{formatCurrency(terpakai)}</div>
                    </div>
                    <div className="budget-card-item sisa">
                        <div className="card-label">Sisa</div>
                        <div className="card-value green">{formatCurrency(sisa)}</div>
                    </div>
                </div>
            </div>

            {/* Status Kegiatan Section - Live Synced */}
            <div className="status-kegiatan-section">
                <div className="status-kegiatan-header-title">
                    <span>📊 Status Kegiatan</span>
                </div>

                <div className="overall-progress-card">
                    <div className="progress-top">
                        <span className="progress-label">Progress Keseluruhan</span>
                        <span className="progress-percent">
                            {completedPercentage}%
                        </span>
                    </div>
                    <div className="progress-bar-main">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${completedPercentage}%` }}
                        ></div>
                    </div>
                    <div className="progress-footer">
                        <span>{statusCounts.completed} selesai</span>
                        <span>{workPlans.length} total</span>
                    </div>
                </div>

                {/* Group Status: Selesai */}
                <div className="status-group">
                    <div className="group-header">
                        <div className="group-title">
                            <span className="group-icon-check">✅</span>
                            <span>Selesai</span>
                        </div>
                        <span className="group-badge green">{statusCounts.completed}</span>
                    </div>
                    <div className="group-list">
                        {workPlans.filter(p => p.status === 'completed').length > 0 ? (
                            workPlans.filter(p => p.status === 'completed').map((plan, idx) => (
                                <div key={plan.id} className="compact-activity-card green-border">
                                    <span className="card-icon">{['♎', '🔍', '🚦'][idx % 3]}</span>
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

                {/* Group Status: Sedang Berjalan */}
                <div className="status-group">
                    <div className="group-header">
                        <div className="group-title">
                            <span className="group-icon-sync">🔄</span>
                            <span>Sedang Berjalan</span>
                        </div>
                        <span className="group-badge orange">{statusCounts.ongoing}</span>
                    </div>
                    <div className="group-list">
                        {workPlans.filter(p => p.status === 'ongoing').length > 0 ? (
                            workPlans.filter(p => p.status === 'ongoing').map((plan, idx) => (
                                <div key={plan.id} className="compact-activity-card orange-border">
                                    <span className="card-icon">{['🔍', '📂', '⚡'][idx % 3]}</span>
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

                {/* Group Status: Belum Mulai */}
                <div className="status-group">
                    <div className="group-header">
                        <div className="group-title">
                            <span className="group-icon-plan">📋</span>
                            <span>Belum Mulai</span>
                        </div>
                        <span className="group-badge gray">{statusCounts.pending}</span>
                    </div>
                    <div className="group-list">
                        {workPlans.filter(p => p.status === 'pending').length > 0 ? (
                            workPlans.filter(p => p.status === 'pending').map((plan, idx) => (
                                <div key={plan.id} className="compact-activity-card gray-border">
                                    <span className="card-icon">{['⚖️', '📄', '📅'][idx % 3]}</span>
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
            </div>

            {/* Judul Rencana Kegiatan dengan Tombol Tambah (Baris Putih) */}
            <div className="rencana-kegiatan-header">
                <div className="rk-left">
                    <h3>Rencana Kegiatan</h3>
                </div>
                <div className="rk-right">
                    <span className="activity-count-text">{workPlans.length} Kegiatan</span>
                    <button className="btn-tambah-new" onClick={handleOpenAddModal}>
                        <span>+</span> Tambah
                    </button>
                </div>
            </div>

            {/* Work Plans List */}
            <div className="workplans-container">
                {workPlans.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <p>Belum ada rencana kerja. Klik "Tambah" untuk menambahkan.</p>
                    </div>
                ) : (
                    workPlans.map(plan => (
                        <div key={plan.id} className="workplan-card">
                            <div className="workplan-content">
                                <div className="workplan-main">
                                    <h3>{plan.title}</h3>
                                    {plan.description && <p className="workplan-desc">{plan.description}</p>}
                                    <div className="workplan-meta">
                                        <span className="meta-date">📅 {formatDate(plan.deadline)}</span>
                                        {plan.budget > 0 && (
                                            <span className="meta-budget">💵 {formatCurrency(plan.budget)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="workplan-actions">
                                    <span className={`status-badge ${getStatusClass(plan.status)}`}>
                                        {getStatusLabel(plan.status)}
                                    </span>
                                    <div className="action-buttons">
                                        <button className="btn-action edit" onClick={() => handleOpenEditModal(plan)}>
                                            ✏️ Edit
                                        </button>
                                        <button className="btn-action delete" onClick={() => handleDelete(plan.id)}>
                                            🗑️ Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {
                showAddModal && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title">
                                    <span className="modal-icon">➕</span>
                                    <h2>{editingId ? 'Edit Rencana Kerja' : 'Tambah Rencana Kerja'}</h2>
                                </div>
                                <button className="modal-close" onClick={handleCloseModal}>✕</button>
                            </div>
                            <div className="modal-body">
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
                                        rows={4}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tanggal</label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
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
                                    <label>Realisasi Anggaran</label>
                                    <div className="input-currency realization-input">
                                        <span className="currency-prefix">Rp</span>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={formatInputCurrency(formData.realization)}
                                            onChange={(e) => setFormData({ ...formData, realization: e.target.value })}
                                        />
                                    </div>
                                    <small className="input-help">Masukkan jumlah anggaran yang sudah terpakai</small>
                                </div>
                                <div className="form-group">
                                    <label>Jenis Kegiatan</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Belanja Barang">📦 Belanja Barang</option>
                                        <option value="Belanja Modal">🏢 Belanja Modal</option>
                                        <option value="Perjalanan Dinas">✈️ Perjalanan Dinas</option>
                                        <option value="Pemeliharaan">🛠️ Pemeliharaan</option>
                                        <option value="Honorarium/Pegawai">👥 Honorarium/Pegawai</option>
                                        <option value="Lain-lain">📄 Lain-lain</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">📋 Rencana</option>
                                        <option value="ongoing">⏳ Berjalan</option>
                                        <option value="completed">✅ Selesai</option>
                                    </select>
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
                )
            }

            {/* Report Modal */}
            {
                showReportModal && (
                    <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                        <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="report-header">
                                <div className="report-title">
                                    <span className="report-icon">📊</span>
                                    <div>
                                        <h2>Laporan Keuangan</h2>
                                        <p>Seksi {sectionInfo.title} - Periode 2026</p>
                                    </div>
                                </div>
                                <button className="modal-close" onClick={() => setShowReportModal(false)}>✕</button>
                            </div>

                            {/* Tabs */}
                            <div className="report-tabs">
                                <button
                                    className={`tab-btn ${reportTab === 'ringkasan' ? 'active' : ''}`}
                                    onClick={() => setReportTab('ringkasan')}
                                >
                                    📋 Ringkasan
                                </button>
                                <button
                                    className={`tab-btn ${reportTab === 'detail' ? 'active' : ''}`}
                                    onClick={() => setReportTab('detail')}
                                >
                                    📄 Detail Kegiatan
                                </button>
                            </div>

                            <div className="report-body">
                                {reportTab === 'ringkasan' ? (
                                    <>
                                        {/* Summary Cards */}
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

                                        {/* Status Allocation */}
                                        <div className="status-allocation">
                                            <h3>📊 Alokasi Berdasarkan Status</h3>
                                            <div className="allocation-cards">
                                                <div className="allocation-card selesai">
                                                    <div className="allocation-header">Selesai</div>
                                                    <div className="allocation-amount">
                                                        {formatCurrency(workPlans.filter(wp => wp.status === 'completed').reduce((sum, wp) => sum + wp.budget, 0))}
                                                    </div>
                                                    <div className="allocation-count">{statusCounts.completed} kegiatan</div>
                                                </div>
                                                <div className="allocation-card berjalan">
                                                    <div className="allocation-header">Berjalan</div>
                                                    <div className="allocation-amount">
                                                        {formatCurrency(workPlans.filter(wp => wp.status === 'ongoing').reduce((sum, wp) => sum + wp.budget, 0))}
                                                    </div>
                                                    <div className="allocation-count">{statusCounts.ongoing} kegiatan</div>
                                                </div>
                                                <div className="allocation-card rencana">
                                                    <div className="allocation-header">Rencana</div>
                                                    <div className="allocation-amount">
                                                        {formatCurrency(workPlans.filter(wp => wp.status === 'pending').reduce((sum, wp) => sum + wp.budget, 0))}
                                                    </div>
                                                    <div className="allocation-count">{statusCounts.pending} kegiatan</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Section */}
                                        <div className="progress-section">
                                            <h3>📈 Progress Anggaran</h3>
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
                                    <>
                                        {/* Detail Table Modern FA Style */}
                                        <div className="detail-table-container">
                                            <table className="detail-table">
                                                <thead>
                                                    <tr>
                                                        <th>No</th>
                                                        <th>Kegiatan / Jenis</th>
                                                        <th className="text-right">Pagu</th>
                                                        <th className="text-right">Realisasi</th>
                                                        <th className="text-right">Sisa</th>
                                                        <th className="text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {workPlans.map((plan, index) => {
                                                        const realisasiItem = plan.realization || 0;
                                                        const sisaItem = plan.budget - realisasiItem;

                                                        return (
                                                            <tr key={plan.id}>
                                                                <td className="text-center">{index + 1}</td>
                                                                <td>
                                                                    <div className="td-kegiatan-info">
                                                                        <span className="td-title">{plan.title}</span>
                                                                        <span className="td-category">{plan.category || 'Belanja Barang'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="text-right font-mono">{formatCurrency(plan.budget)}</td>
                                                                <td className="text-right font-mono blue-text">{formatCurrency(realisasiItem)}</td>
                                                                <td className="text-right font-mono orange-text">{formatCurrency(sisaItem)}</td>
                                                                <td className="text-center">
                                                                    <span className={`status-dot ${plan.status}`}></span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="footer-total-row">
                                                        <td colSpan="2" className="text-center font-bold">TOTAL ({workPlans.length} Kegiatan)</td>
                                                        <td className="text-right font-bold">{formatCurrency(workPlans.reduce((sum, p) => sum + p.budget, 0))}</td>
                                                        <td className="text-right font-bold blue-text">{formatCurrency(terpakai)}</td>
                                                        <td className="text-right font-bold orange-text">{formatCurrency(sisa)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SectionContent;
