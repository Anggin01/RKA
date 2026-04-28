import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import FlatIcon from './FlatIcon';
import './Settings.css';

const SECTIONS = [
    { id: 'tikim', label: 'Tikim', icon: 'scale', fullName: 'Teknologi Informasi dan Komunikasi Imigrasi' },
    { id: 'inteldakim', label: 'Inteldakim', icon: 'search', fullName: 'Intelijen dan Penindakan Keimigrasian' },
    { id: 'lalintalkim', label: 'Lalintalkim', icon: 'car', fullName: 'Lalu Lintas dan Izin Tinggal Keimigrasian' },
    { id: 'umum', label: 'Umum', icon: 'clipboard', fullName: 'Umum dan Administrasi' },
    { id: 'keuangan', label: 'Keuangan', icon: 'wallet', fullName: 'Keuangan dan Anggaran' },
    { id: 'kepegawaian', label: 'Kepegawaian', icon: 'people', fullName: 'Kepegawaian dan Sumber Daya Manusia' },
    { id: 'fasilitatif', label: 'Fasilitatif', icon: 'building', fullName: 'Fasilitatif dan Layanan Pendukung' },
    { id: 'reformasi-birokrasi', label: 'Reformasi Birokrasi', icon: 'landmark', fullName: 'Reformasi Birokrasi dan Tata Kelola' },
];

// Default master password (stored in localStorage for simplicity)
const MASTER_PASSWORD_KEY = 'rka_master_password';
const DEFAULT_MASTER_PASSWORD = 'admin123';

const Settings = ({ setActiveMenu }) => {
    const [adminData, setAdminData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState('');
    const [showSetPasswordModal, setShowSetPasswordModal] = useState(null);
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminUsername, setNewAdminUsername] = useState('');

    // Change master password states
    const [currentMasterPw, setCurrentMasterPw] = useState('');
    const [newMasterPw, setNewMasterPw] = useState('');
    const [confirmMasterPw, setConfirmMasterPw] = useState('');

    useEffect(() => {
        loadAdminData();
    }, []);

    const getMasterPassword = () => {
        return localStorage.getItem(MASTER_PASSWORD_KEY) || DEFAULT_MASTER_PASSWORD;
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const loadAdminData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_seksi')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                setAdminData(data);
            } else {
                // Initialize default admin data for all sections
                const defaultAdmins = SECTIONS.map(section => ({
                    seksi_id: section.id,
                    username: `admin_${section.id}`,
                    password: section.id,
                    can_view: true,
                    can_edit: false,
                    is_active: false,
                }));

                const { data: inserted, error: insertError } = await supabase
                    .from('admin_seksi')
                    .insert(defaultAdmins)
                    .select();

                if (insertError) throw insertError;
                setAdminData(inserted || defaultAdmins);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            // Fallback to local defaults if table doesn't exist
            const defaultAdmins = SECTIONS.map(section => ({
                seksi_id: section.id,
                username: `admin_${section.id}`,
                password: section.id,
                can_view: true,
                can_edit: false,
                is_active: false,
            }));
            setAdminData(defaultAdmins);
            showToast('[!] Tabel admin_seksi belum ada. Jalankan SQL terlebih dahulu.');
        } finally {
            setIsLoading(false);
        }
    };

    const updatePermission = async (seksiId, field, value) => {
        try {
            const { error } = await supabase
                .from('admin_seksi')
                .update({ [field]: value })
                .eq('seksi_id', seksiId);

            if (error) throw error;

            setAdminData(prev =>
                prev.map(admin =>
                    admin.seksi_id === seksiId ? { ...admin, [field]: value } : admin
                )
            );

            const sectionName = SECTIONS.find(s => s.id === seksiId)?.label;
            const fieldLabel = field === 'can_view' ? 'Lihat' : field === 'can_edit' ? 'Edit' : 'Status';
            showToast(`[OK] ${fieldLabel} untuk ${sectionName} berhasil diperbarui`);
        } catch (error) {
            console.error('Error updating permission:', error);
            showToast('[ERROR] Gagal memperbarui izin');
        }
    };

    const handleSetPassword = async () => {
        if (!newAdminPassword.trim()) {
            showToast('[!] Password tidak boleh kosong');
            return;
        }

        try {
            const updates = { password: newAdminPassword };
            if (newAdminUsername.trim()) {
                updates.username = newAdminUsername;
            }

            const { error } = await supabase
                .from('admin_seksi')
                .update(updates)
                .eq('seksi_id', showSetPasswordModal);

            if (error) throw error;

            setAdminData(prev =>
                prev.map(admin =>
                    admin.seksi_id === showSetPasswordModal
                        ? { ...admin, ...updates }
                        : admin
                )
            );

            const sectionName = SECTIONS.find(s => s.id === showSetPasswordModal)?.label;
            showToast(`[OK] Password admin ${sectionName} berhasil diperbarui`);
            setShowSetPasswordModal(null);
            setNewAdminPassword('');
            setNewAdminUsername('');
        } catch (error) {
            console.error('Error setting password:', error);
            showToast('[ERROR] Gagal mengubah password');
        }
    };

    const handleChangeMasterPassword = () => {
        const currentMaster = getMasterPassword();
        if (currentMasterPw !== currentMaster) {
            showToast('[ERROR] Password lama salah!');
            return;
        }
        if (newMasterPw.length < 4) {
            showToast('[!] Password baru minimal 4 karakter');
            return;
        }
        if (newMasterPw !== confirmMasterPw) {
            showToast('[ERROR] Password baru tidak cocok!');
            return;
        }
        localStorage.setItem(MASTER_PASSWORD_KEY, newMasterPw);
        setCurrentMasterPw('');
        setNewMasterPw('');
        setConfirmMasterPw('');
        showToast('[OK] Password Super Admin berhasil diubah!');
    };

    const getAdminForSection = (seksiId) => {
        return adminData.find(a => a.seksi_id === seksiId) || {
            can_view: false,
            can_edit: false,
            is_active: false,
            username: '',
            password: ''
        };
    };

    const activeCount = adminData.filter(a => a.is_active).length;
    const editCount = adminData.filter(a => a.can_edit).length;
    const viewCount = adminData.filter(a => a.can_view).length;

    // Loading State
    if (isLoading) {
        return (
            <div className="settings-page">
                <div className="settings-loading">
                    <div className="spinner"></div>
                    <p>Memuat data admin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            {/* Toast */}
            {toast && <div className="settings-toast">{toast}</div>}

            {/* Header */}
            <div className="settings-header-box">
                <div className="settings-header-left">
                    <div className="settings-header-icon"><FlatIcon name="gear" size={24} color="#fff" /></div>
                    <div className="settings-header-text">
                        <h1>Pengaturan Admin</h1>
                        <p>Kelola izin akses admin untuk setiap seksi</p>
                    </div>
                </div>
                <div className="settings-header-badge">
                    <FlatIcon name="crown" size={16} /> Super Admin
                </div>
            </div>

            {/* Stats */}
            <div className="settings-stats">
                <div className="stat-card">
                    <div className="stat-icon blue"><FlatIcon name="user" size={20} color="#3b82f6" /></div>
                    <div className="stat-info">
                        <h3>{SECTIONS.length}</h3>
                        <p>Total Seksi</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><FlatIcon name="check" size={20} color="#22c55e" /></div>
                    <div className="stat-info">
                        <h3>{activeCount}</h3>
                        <p>Admin Aktif</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><FlatIcon name="edit" size={20} color="#eab308" /></div>
                    <div className="stat-info">
                        <h3>{editCount}</h3>
                        <p>Izin Edit</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><FlatIcon name="eye" size={20} color="#ef4444" /></div>
                    <div className="stat-info">
                        <h3>{viewCount}</h3>
                        <p>Izin Lihat</p>
                    </div>
                </div>
            </div>

            {/* Admin Per Seksi */}
            <div className="admin-section">
                <div className="admin-section-header">
                    <div className="admin-section-title">
                        <span><FlatIcon name="shield" size={20} /></span>
                        <h2>Admin Per Seksi</h2>
                    </div>
                    <div className="admin-count-badge">{SECTIONS.length} Seksi</div>
                </div>

                <div className="admin-cards-grid">
                    {SECTIONS.map(section => {
                        const admin = getAdminForSection(section.id);
                        return (
                            <div key={section.id} className="admin-card">
                                <div className="admin-card-header">
                                    <div className={`admin-avatar ${section.id}`}>
                                        <FlatIcon name={section.icon} size={20} />
                                    </div>
                                    <div className="admin-card-info">
                                        <h3>{section.label}</h3>
                                        <p>{admin.username || `admin_${section.id}`}</p>
                                    </div>
                                </div>
                                <div className="admin-card-body">
                                    {/* Aktif Toggle */}
                                    <div className="permission-row">
                                        <div className="permission-label">
                                            <span><FlatIcon name="key" size={14} /></span>
                                            <span className="permission-label-text">Aktifkan Admin</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={admin.is_active || false}
                                                onChange={(e) => updatePermission(section.id, 'is_active', e.target.checked)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {/* View Toggle */}
                                    <div className="permission-row">
                                        <div className="permission-label">
                                            <span><FlatIcon name="eye" size={14} /></span>
                                            <span className="permission-label-text">Izin Lihat</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={admin.can_view || false}
                                                onChange={(e) => updatePermission(section.id, 'can_view', e.target.checked)}
                                                disabled={!admin.is_active}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {/* Edit Toggle */}
                                    <div className="permission-row">
                                        <div className="permission-label">
                                            <span><FlatIcon name="edit" size={14} /></span>
                                            <span className="permission-label-text">Izin Edit</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={admin.can_edit || false}
                                                onChange={(e) => updatePermission(section.id, 'can_edit', e.target.checked)}
                                                disabled={!admin.is_active}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <div className="admin-card-footer">
                                    <div className={`admin-status ${admin.is_active ? 'active' : 'inactive'}`}>
                                        <span className={`status-dot-indicator ${admin.is_active ? 'active' : 'inactive'}`}></span>
                                        {admin.is_active ? 'Aktif' : 'Nonaktif'}
                                    </div>
                                    <button
                                        className="btn-reset-password"
                                        onClick={() => {
                                            setShowSetPasswordModal(section.id);
                                            setNewAdminUsername(admin.username || `admin_${section.id}`);
                                            setNewAdminPassword('');
                                        }}
                                    >
                                        <FlatIcon name="lock" size={14} /> Atur Password
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Change Master Password */}
            <div className="password-change-section">
                <div className="password-change-header">
                    <span><FlatIcon name="lock" size={20} /></span>
                    <h2>Ubah Password Super Admin</h2>
                </div>
                <div className="password-form-grid">
                    <div className="password-form-group">
                        <label>Password Lama</label>
                        <input
                            type="password"
                            placeholder="Masukkan password lama..."
                            value={currentMasterPw}
                            onChange={(e) => setCurrentMasterPw(e.target.value)}
                        />
                    </div>
                    <div className="password-form-group">
                        <label>Password Baru</label>
                        <input
                            type="password"
                            placeholder="Masukkan password baru..."
                            value={newMasterPw}
                            onChange={(e) => setNewMasterPw(e.target.value)}
                        />
                    </div>
                    <div className="password-form-group">
                        <label>Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            placeholder="Konfirmasi password baru..."
                            value={confirmMasterPw}
                            onChange={(e) => setConfirmMasterPw(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn-change-password" onClick={handleChangeMasterPassword}>
                    <FlatIcon name="refresh" size={16} /> Ubah Password
                </button>
            </div>

            {/* Set Password Modal */}
            {showSetPasswordModal && (
                <div className="set-password-modal" onClick={() => setShowSetPasswordModal(null)}>
                    <div className="set-password-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3><FlatIcon name="lock" size={18} /> Atur Password Admin</h3>
                        <p>
                            Seksi: <strong>{SECTIONS.find(s => s.id === showSetPasswordModal)?.label}</strong>
                        </p>
                        <div className="modal-form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                placeholder="Username admin..."
                                value={newAdminUsername}
                                onChange={(e) => setNewAdminUsername(e.target.value)}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label>Password Baru</label>
                            <input
                                type="password"
                                placeholder="Password baru..."
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="modal-buttons">
                            <button className="btn-cancel" onClick={() => setShowSetPasswordModal(null)}>
                                Batal
                            </button>
                            <button className="btn-save" onClick={handleSetPassword}>
                                <FlatIcon name="save" size={16} /> Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
