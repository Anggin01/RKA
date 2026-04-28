import './Sidebar.css';
import FlatIcon from './FlatIcon';

const Sidebar = ({ activeMenu, setActiveMenu, isOpen, onClose, user, onLogout }) => {
    const menuSections = [
        { id: 'tikim', label: 'Tikim', icon: 'scale' },
        { id: 'inteldakim', label: 'Inteldakim', icon: 'search' },
        { id: 'lalintalkim', label: 'Lalintalkim', icon: 'car' },
        { id: 'umum', label: 'Umum', icon: 'clipboard' },
        { id: 'keuangan', label: 'Keuangan', icon: 'wallet' },
        { id: 'kepegawaian', label: 'Kepegawaian', icon: 'people' },
        { id: 'fasilitatif', label: 'Fasilitatif', icon: 'building' },
        { id: 'reformasi-birokrasi', label: 'Reformasi Birokrasi', icon: 'landmark' },
    ];

    const isSuperAdmin = user?.role === 'super_admin';
    const isAdminSeksi = user?.role === 'admin_seksi';

    // Filter menu items based on role
    const getVisibleSections = () => {
        if (isSuperAdmin) return menuSections;
        if (isAdminSeksi) {
            return menuSections.filter(m => m.id === user.seksiId);
        }
        return [];
    };

    const visibleSections = getVisibleSections();

    const handleLogout = () => {
        if (window.confirm('Apakah Anda yakin ingin keluar?')) {
            onLogout();
        }
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Close button for mobile */}
            <button className="sidebar-close-btn" onClick={onClose}>✕</button>

            {/* Logo Section */}
            <div className="sidebar-header">
                <div className="logo-container">
                    {/* Formal RKA Logo */}
                    <div className="logo-icon">
                        <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Outer Circle - Government Style */}
                            <circle cx="30" cy="30" r="28" stroke="#fbbf24" strokeWidth="2" fill="none" />
                            <circle cx="30" cy="30" r="24" stroke="#fbbf24" strokeWidth="1" fill="none" />

                            {/* Shield Shape */}
                            <path
                                d="M30 8 L48 16 L48 32 C48 42 40 50 30 54 C20 50 12 42 12 32 L12 16 Z"
                                fill="#1e40af"
                                stroke="#fbbf24"
                                strokeWidth="1.5"
                            />

                            {/* Inner decorative lines */}
                            <path d="M30 12 L44 18 L44 32 C44 40 38 46 30 50 C22 46 16 40 16 32 L16 18 Z"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="0.5"
                            />

                            {/* Document/Book Icon in center */}
                            <rect x="22" y="20" width="16" height="20" rx="1" fill="#fbbf24" />
                            <rect x="24" y="22" width="12" height="2" rx="0.5" fill="#1e40af" />
                            <rect x="24" y="26" width="12" height="1" rx="0.5" fill="#1e40af" />
                            <rect x="24" y="29" width="8" height="1" rx="0.5" fill="#1e40af" />
                            <rect x="24" y="32" width="10" height="1" rx="0.5" fill="#1e40af" />
                            <rect x="24" y="35" width="6" height="1" rx="0.5" fill="#1e40af" />

                            {/* Coin/Budget symbol overlay */}
                            <circle cx="38" cy="36" r="6" fill="#fbbf24" stroke="#1e40af" strokeWidth="1" />
                            <text x="38" y="39" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e40af">Rp</text>

                            {/* Stars decoration */}
                            <polygon points="30,6 31,8 33,8 31.5,9.5 32,11.5 30,10 28,11.5 28.5,9.5 27,8 29,8" fill="#fbbf24" />
                        </svg>
                    </div>
                    <div className="logo-text">
                        <h1>RKA</h1>
                        <p>Rencana Kerja dan Anggaran</p>
                    </div>
                </div>
            </div>

            {/* User Role Badge */}
            <div className="sidebar-user-badge">
                <div className={`user-badge ${isSuperAdmin ? 'super-admin' : 'admin-seksi'}`}>
                    <span className="badge-icon">{isSuperAdmin ? <FlatIcon name="crown" size={16} /> : <FlatIcon name="landmark" size={16} />}</span>
                    <div className="badge-info">
                        <span className="badge-name">{user?.displayName || 'User'}</span>
                        <span className="badge-role">
                            {isSuperAdmin ? 'Super Admin' : `Admin ${user?.seksiLabel || ''}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Scrollable Navigation */}
            <nav className="sidebar-nav">
                {/* Dashboard Menu - Only for Super Admin */}
                {isSuperAdmin && (
                    <div className="menu-section">
                        <button
                            className={`menu-item dashboard-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveMenu('dashboard')}
                        >
                            <span className="menu-icon"><FlatIcon name="chart" size={16} /></span>
                            <span className="menu-label">Dashboard Kalender</span>
                        </button>
                    </div>
                )}

                {/* Seksi Section */}
                <div className="menu-section">
                    <div className="section-title">
                        {isSuperAdmin ? 'SEKSI' : 'SEKSI SAYA'}
                    </div>
                    <div className="menu-list">
                        {visibleSections.map((menu) => (
                            <button
                                key={menu.id}
                                className={`menu-item ${activeMenu === menu.id ? 'active' : ''}`}
                                onClick={() => setActiveMenu(menu.id)}
                            >
                                <span className="menu-icon"><FlatIcon name={menu.icon} size={16} /></span>
                                <span className="menu-label">{menu.label}</span>
                                {isAdminSeksi && !user?.canEdit && (
                                    <span className="menu-badge view-only" title="Hanya bisa melihat"><FlatIcon name="eye" size={12} /></span>
                                )}
                                {isAdminSeksi && user?.canEdit && (
                                    <span className="menu-badge can-edit" title="Bisa melihat & edit"><FlatIcon name="edit" size={12} /></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pengaturan Section - Only for Super Admin */}
                {isSuperAdmin && (
                    <div className="menu-section">
                        <div className="section-title">PENGATURAN</div>
                        <div className="menu-list">
                            <button
                                className={`menu-item settings-item ${activeMenu === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveMenu('settings')}
                            >
                                <span className="menu-icon"><FlatIcon name="gear" size={16} /></span>
                                <span className="menu-label">Settings</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Permission Info for Admin Seksi */}
                {isAdminSeksi && (
                    <div className="menu-section">
                        <div className="section-title">IZIN AKSES</div>
                        <div className="permission-info-card">
                            <div className="perm-row">
                                <span className="perm-label"><FlatIcon name="eye" size={14} /> Lihat</span>
                                <span className={`perm-value ${user?.canView ? 'active' : 'inactive'}`}>
                                    {user?.canView ? <><FlatIcon name="check" size={14} color="#22c55e" /> Aktif</> : <><FlatIcon name="cross" size={14} color="#ef4444" /> Tidak</>}
                                </span>
                            </div>
                            <div className="perm-row">
                                <span className="perm-label"><FlatIcon name="edit" size={14} /> Edit</span>
                                <span className={`perm-value ${user?.canEdit ? 'active' : 'inactive'}`}>
                                    {user?.canEdit ? <><FlatIcon name="check" size={14} color="#22c55e" /> Aktif</> : <><FlatIcon name="lock" size={14} /> Perlu Izin</>}
                                </span>
                            </div>
                            {!user?.canEdit && (
                                <p className="perm-hint">
                                    <FlatIcon name="bulb" size={14} /> Hubungi Super Admin untuk mendapatkan izin edit
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Logout + Footer */}
            <div className="sidebar-footer">
                <button className="btn-logout" onClick={handleLogout}>
                    <span><FlatIcon name="door" size={16} /></span>
                    <span>Keluar</span>
                </button>
                <p>© 2026 RKA</p>
            </div>
        </aside>
    );
};

export default Sidebar;
