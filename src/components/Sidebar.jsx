import './Sidebar.css';

const Sidebar = ({ activeMenu, setActiveMenu, isOpen, onClose }) => {
    const menuSections = [
        { id: 'tikim', label: 'Tikim', icon: '⚖️' },
        { id: 'inteldakim', label: 'Inteldakim', icon: '🔍' },
        { id: 'lalintalkim', label: 'Lalintalkim', icon: '🚗' },
        { id: 'umum', label: 'Umum', icon: '📋' },
        { id: 'keuangan', label: 'Keuangan', icon: '💰' },
        { id: 'kepegawaian', label: 'Kepegawaian', icon: '👥' },
        { id: 'fasilitatif', label: 'Fasilitatif', icon: '🏢' },
        { id: 'reformasi-birokrasi', label: 'Reformasi Birokrasi', icon: '🏛️' },
    ];

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

            {/* Scrollable Navigation */}
            <nav className="sidebar-nav">
                {/* Dashboard Menu */}
                <div className="menu-section">
                    <button
                        className={`menu-item dashboard-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('dashboard')}
                    >
                        <span className="menu-icon">📊</span>
                        <span className="menu-label">Dashboard Kalender</span>
                    </button>
                </div>

                {/* Seksi Section */}
                <div className="menu-section">
                    <div className="section-title">SEKSI</div>
                    <div className="menu-list">
                        {menuSections.map((menu) => (
                            <button
                                key={menu.id}
                                className={`menu-item ${activeMenu === menu.id ? 'active' : ''}`}
                                onClick={() => setActiveMenu(menu.id)}
                            >
                                <span className="menu-icon">{menu.icon}</span>
                                <span className="menu-label">{menu.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <p>© 2026 RKA</p>
            </div>
        </aside>
    );
};

export default Sidebar;
