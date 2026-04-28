import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);

// Constants
const MASTER_PASSWORD_KEY = 'rka_master_password';
const DEFAULT_MASTER_PASSWORD = 'admin123';
const AUTH_SESSION_KEY = 'rka_auth_session';

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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { role: 'super_admin' | 'admin_seksi', seksiId?, seksiLabel?, canView?, canEdit? }
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                // Validate session is not expired (24 hours)
                if (session.timestamp && Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                    setUser(session.user);
                } else {
                    localStorage.removeItem(AUTH_SESSION_KEY);
                }
            } catch (e) {
                localStorage.removeItem(AUTH_SESSION_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const getMasterPassword = () => {
        return localStorage.getItem(MASTER_PASSWORD_KEY) || DEFAULT_MASTER_PASSWORD;
    };

    // Login as Super Admin
    const loginAsSuperAdmin = (password) => {
        const masterPw = getMasterPassword();
        if (password === masterPw) {
            const userData = {
                role: 'super_admin',
                displayName: 'Super Admin',
                canView: true,
                canEdit: true,
            };
            setUser(userData);
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
                user: userData,
                timestamp: Date.now()
            }));
            return { success: true };
        }
        return { success: false, error: 'Password salah!' };
    };

    // Login as Admin Seksi
    const loginAsAdminSeksi = async (username, password) => {
        try {
            const { data, error } = await supabase
                .from('admin_seksi')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (error || !data) {
                return { success: false, error: 'Username atau password salah!' };
            }

            if (!data.is_active) {
                return { success: false, error: 'Akun admin ini belum diaktifkan oleh Super Admin.' };
            }

            if (!data.can_view) {
                return { success: false, error: 'Akun admin ini belum memiliki izin akses. Hubungi Super Admin.' };
            }

            const section = SECTIONS.find(s => s.id === data.seksi_id);
            const userData = {
                role: 'admin_seksi',
                seksiId: data.seksi_id,
                seksiLabel: section?.label || data.seksi_id,
                displayName: data.username,
                canView: data.can_view,
                canEdit: data.can_edit,
            };

            setUser(userData);
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
                user: userData,
                timestamp: Date.now()
            }));
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Terjadi kesalahan saat login.' };
        }
    };

    // Refresh permissions from database (for Admin Seksi)
    const refreshPermissions = async () => {
        if (!user || user.role !== 'admin_seksi') return;

        try {
            const { data, error } = await supabase
                .from('admin_seksi')
                .select('*')
                .eq('seksi_id', user.seksiId)
                .single();

            if (error || !data) return;

            const updatedUser = {
                ...user,
                canView: data.can_view,
                canEdit: data.can_edit,
            };

            setUser(updatedUser);
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
                user: updatedUser,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error refreshing permissions:', error);
        }
    };

    // Logout
    const logout = () => {
        setUser(null);
        localStorage.removeItem(AUTH_SESSION_KEY);
    };

    // Check if user can access a specific section
    const canAccessSection = (sectionId) => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        return user.seksiId === sectionId && user.canView;
    };

    // Check if user can edit a specific section
    const canEditSection = (sectionId) => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        return user.seksiId === sectionId && user.canEdit;
    };

    // Check if user is super admin
    const isSuperAdmin = () => {
        return user?.role === 'super_admin';
    };

    const value = {
        user,
        isLoading,
        loginAsSuperAdmin,
        loginAsAdminSeksi,
        logout,
        canAccessSection,
        canEditSection,
        isSuperAdmin,
        refreshPermissions,
        SECTIONS,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
