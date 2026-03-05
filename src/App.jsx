import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SectionContent from './components/SectionContent';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';
import { startKeepAlive, stopKeepAlive } from './utils/storage';
import './components/Sidebar.css';
import './App.css';

function AppContent() {
  const { user, isLoading, canAccessSection, canEditSection, isSuperAdmin, logout, refreshPermissions } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Start keep-alive service to prevent Supabase from pausing
  useEffect(() => {
    startKeepAlive();
    return () => stopKeepAlive();
  }, []);

  // Refresh permissions periodically for Admin Seksi
  useEffect(() => {
    if (user && user.role === 'admin_seksi') {
      const interval = setInterval(() => {
        refreshPermissions();
      }, 60000); // Every 1 minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // Set default menu based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin_seksi') {
        setActiveMenu(user.seksiId);
      } else {
        setActiveMenu('dashboard');
      }
    }
  }, [user]);

  // Show loading
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Memuat aplikasi...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Get section title and description based on active menu
  const getSectionInfo = () => {
    const sections = {
      'dashboard': {
        title: 'Dashboard Kalender',
        subtitle: 'Kalender Kegiatan dan Jadwal',
        color: '#1e40af'
      },
      'tikim': {
        title: 'Tikim',
        subtitle: 'Seksi Teknologi Informasi dan Komunikasi Imigrasi',
        color: '#1e40af'
      },
      'inteldakim': {
        title: 'Inteldakim',
        subtitle: 'Seksi Intelijen dan Penindakan Keimigrasian',
        color: '#1e40af'
      },
      'lalintalkim': {
        title: 'Lalintalkim',
        subtitle: 'Seksi Lalu Lintas dan Izin Tinggal Keimigrasian',
        color: '#1e40af'
      },
      'umum': {
        title: 'Umum',
        subtitle: 'Seksi Umum dan Administrasi',
        color: '#1e40af'
      },
      'keuangan': {
        title: 'Keuangan',
        subtitle: 'Seksi Keuangan dan Anggaran',
        color: '#1e40af'
      },
      'kepegawaian': {
        title: 'Kepegawaian',
        subtitle: 'Seksi Kepegawaian dan Sumber Daya Manusia',
        color: '#1e40af'
      },
      'fasilitatif': {
        title: 'Fasilitatif',
        subtitle: 'Seksi Fasilitatif dan Layanan Pendukung',
        color: '#1e40af'
      },
      'reformasi-birokrasi': {
        title: 'Reformasi Birokrasi',
        subtitle: 'Seksi Reformasi Birokrasi dan Tata Kelola',
        color: '#1e40af'
      },
      'settings': {
        title: 'Pengaturan',
        subtitle: 'Kelola admin dan izin akses',
        color: '#1e40af'
      },
    };
    return sections[activeMenu] || sections['dashboard'];
  };

  const sectionInfo = getSectionInfo();

  const handleMenuClick = (menuId) => {
    // Check access for section pages
    const sectionIds = ['tikim', 'inteldakim', 'lalintalkim', 'umum', 'keuangan', 'kepegawaian', 'fasilitatif', 'reformasi-birokrasi'];
    if (sectionIds.includes(menuId) && !canAccessSection(menuId)) {
      alert('⚠️ Anda tidak memiliki akses ke seksi ini.');
      return;
    }
    // Only super admin can access settings
    if (menuId === 'settings' && !isSuperAdmin()) {
      alert('⚠️ Hanya Super Admin yang bisa mengakses pengaturan.');
      return;
    }
    setActiveMenu(menuId);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeMenu === 'dashboard') {
      return <Dashboard />;
    }
    if (activeMenu === 'settings') {
      if (!isSuperAdmin()) {
        return (
          <div className="access-denied">
            <span className="access-denied-icon">🔒</span>
            <h2>Akses Ditolak</h2>
            <p>Hanya Super Admin yang dapat mengakses halaman pengaturan.</p>
          </div>
        );
      }
      return <Settings setActiveMenu={setActiveMenu} />;
    }
    // For section content, pass canEdit prop
    const canEdit = canEditSection(activeMenu);
    return <SectionContent sectionId={activeMenu} sectionInfo={sectionInfo} canEdit={canEdit} />;
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
        </button>
        <div className="mobile-logo">
          <span className="mobile-logo-text">RKA</span>
          <span className="mobile-logo-subtitle">Rencana Kerja dan Anggaran</span>
        </div>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
