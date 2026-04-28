import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FlatIcon from './FlatIcon';
import './LoginPage.css';

const LoginPage = () => {
    const { loginAsSuperAdmin, loginAsAdminSeksi, SECTIONS } = useAuth();
    const [loginType, setLoginType] = useState('super_admin'); // 'super_admin' | 'admin_seksi'
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            if (loginType === 'super_admin') {
                if (!password.trim()) {
                    setError('Password tidak boleh kosong!');
                    setIsLoggingIn(false);
                    return;
                }
                const result = loginAsSuperAdmin(password);
                if (!result.success) {
                    setError(result.error);
                }
            } else {
                if (!username.trim() || !password.trim()) {
                    setError('Username dan password tidak boleh kosong!');
                    setIsLoggingIn(false);
                    return;
                }
                const result = await loginAsAdminSeksi(username, password);
                if (!result.success) {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const switchLoginType = (type) => {
        setLoginType(type);
        setError('');
        setPassword('');
        setUsername('');
    };

    return (
        <div className="login-page">
            {/* Animated Background */}
            <div className="login-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
                <div className="shape shape-5"></div>
            </div>

            <div className="login-container">
                {/* Left Side - Branding */}
                <div className="login-branding">
                    <div className="branding-content">
                        <div className="branding-logo">
                            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="30" cy="30" r="28" stroke="#fbbf24" strokeWidth="2" fill="none" />
                                <circle cx="30" cy="30" r="24" stroke="#fbbf24" strokeWidth="1" fill="none" />
                                <path
                                    d="M30 8 L48 16 L48 32 C48 42 40 50 30 54 C20 50 12 42 12 32 L12 16 Z"
                                    fill="#1e40af"
                                    stroke="#fbbf24"
                                    strokeWidth="1.5"
                                />
                                <path d="M30 12 L44 18 L44 32 C44 40 38 46 30 50 C22 46 16 40 16 32 L16 18 Z"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="0.5"
                                />
                                <rect x="22" y="20" width="16" height="20" rx="1" fill="#fbbf24" />
                                <rect x="24" y="22" width="12" height="2" rx="0.5" fill="#1e40af" />
                                <rect x="24" y="26" width="12" height="1" rx="0.5" fill="#1e40af" />
                                <rect x="24" y="29" width="8" height="1" rx="0.5" fill="#1e40af" />
                                <rect x="24" y="32" width="10" height="1" rx="0.5" fill="#1e40af" />
                                <rect x="24" y="35" width="6" height="1" rx="0.5" fill="#1e40af" />
                                <circle cx="38" cy="36" r="6" fill="#fbbf24" stroke="#1e40af" strokeWidth="1" />
                                <text x="38" y="39" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e40af">Rp</text>
                                <polygon points="30,6 31,8 33,8 31.5,9.5 32,11.5 30,10 28,11.5 28.5,9.5 27,8 29,8" fill="#fbbf24" />
                            </svg>
                        </div>
                        <h1 className="branding-title">RKA</h1>
                        <p className="branding-subtitle">Rencana Kerja dan Anggaran</p>
                        <div className="branding-divider"></div>
                        <p className="branding-desc">
                            Sistem Pengelolaan Rencana Kerja dan Anggaran Terpadu
                        </p>
                        <div className="branding-sections">
                            {SECTIONS.map((section, index) => (
                                <span key={section.id} className="section-tag" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <FlatIcon name={section.icon} size={14} /> {section.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="login-form-wrapper">
                    <div className="login-form-inner">
                        {/* Login Type Toggle */}
                        <div className="login-type-toggle">
                            <button
                                className={`toggle-btn ${loginType === 'super_admin' ? 'active' : ''}`}
                                onClick={() => switchLoginType('super_admin')}
                            >
                                <span className="toggle-icon"><FlatIcon name="crown" size={16} /></span>
                                <span className="toggle-label">Super Admin</span>
                            </button>
                            <button
                                className={`toggle-btn ${loginType === 'admin_seksi' ? 'active' : ''}`}
                                onClick={() => switchLoginType('admin_seksi')}
                            >
                                <span className="toggle-icon"><FlatIcon name="landmark" size={16} /></span>
                                <span className="toggle-label">Admin Seksi</span>
                            </button>
                        </div>

                        <div className="login-header">
                            <div className="login-header-icon">
                                {loginType === 'super_admin' ? <FlatIcon name="lock" size={24} /> : <FlatIcon name="key" size={24} />}
                            </div>
                            <h2>{loginType === 'super_admin' ? 'Login Super Admin' : 'Login Admin Seksi'}</h2>
                            <p>
                                {loginType === 'super_admin'
                                    ? 'Akses penuh ke semua fitur dan seluruh seksi'
                                    : 'Akses terbatas ke seksi Anda'
                                }
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            {loginType === 'admin_seksi' && (
                                <div className="form-group">
                                    <label>
                                        <span className="label-icon"><FlatIcon name="user" size={14} /></span>
                                        Username
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Masukkan username..."
                                            value={username}
                                            onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    <span className="label-icon"><FlatIcon name="lock" size={14} /></span>
                                    Password
                                </label>
                                <div className="input-wrapper password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Masukkan password..."
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        autoFocus={loginType === 'super_admin'}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FlatIcon name="eye-off" size={16} /> : <FlatIcon name="eye" size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="login-error">
                                    <span className="error-icon"><FlatIcon name="warning" size={14} color="#ef4444" /></span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn-login ${isLoggingIn ? 'loading' : ''}`}
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Memverifikasi...
                                    </>
                                ) : (
                                    <>
                                        <FlatIcon name="rocket" size={16} /> Masuk
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p>
                                {loginType === 'super_admin'
                                    ? <><FlatIcon name="bulb" size={14} /> Hubungi administrator jika lupa password</>
                                    : <><FlatIcon name="bulb" size={14} /> Hubungi Super Admin untuk mendapatkan akun</>
                                }
                            </p>
                        </div>

                        {/* Role Info Badges */}
                        <div className="role-info">
                            {loginType === 'super_admin' ? (
                                <div className="role-badge super">
                                    <span><FlatIcon name="crown" size={20} /></span>
                                    <div>
                                        <strong>Full Access</strong>
                                        <p>Akses & edit semua seksi, kelola admin</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="role-badge section">
                                    <span><FlatIcon name="landmark" size={20} /></span>
                                    <div>
                                        <strong>Limited Access</strong>
                                        <p>View seksi sendiri, edit perlu izin Super Admin</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
