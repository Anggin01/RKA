import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SectionContent from './components/SectionContent';
import { startKeepAlive, stopKeepAlive } from './utils/storage';
import './components/Sidebar.css';
import './App.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Start keep-alive service to prevent Supabase from pausing
  useEffect(() => {
    startKeepAlive();

    // Cleanup saat aplikasi ditutup
    return () => stopKeepAlive();
  }, []);

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
    };
    return sections[activeMenu] || sections['dashboard'];
  };

  const sectionInfo = getSectionInfo();

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setSidebarOpen(false); // Close sidebar on mobile after selecting menu
  };

  const renderContent = () => {
    if (activeMenu === 'dashboard') {
      return <Dashboard />;
    }
    return <SectionContent sectionId={activeMenu} sectionInfo={sectionInfo} />;
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
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
