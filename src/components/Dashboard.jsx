import { useState, useEffect } from 'react';
import {
    getAllWorkPlans,
    getCalendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    calculateTotalUsedBudget,
    calculateSectionBudget,
    updateWorkPlan,
    deleteWorkPlan
} from '../utils/storage';
import FlatIcon from './FlatIcon';
import './Dashboard.css';

const Dashboard = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [allWorkPlans, setAllWorkPlans] = useState({});
    const [sectionBudgets, setSectionBudgets] = useState([]);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ date: '', title: '', section: 'Tikim', status: 'upcoming' });
    const [editingEventId, setEditingEventId] = useState(null);
    const [editEvent, setEditEvent] = useState({});
    const [saveStatus, setSaveStatus] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const sections = [
        { id: 'tikim', name: 'Tikim' },
        { id: 'inteldakim', name: 'Inteldakim' },
        { id: 'lalintalkim', name: 'Lalintalkim' },
        { id: 'umum', name: 'Umum' },
        { id: 'keuangan', name: 'Keuangan' },
        { id: 'kepegawaian', name: 'Kepegawaian' },
        { id: 'fasilitatif', name: 'Fasilitatif' },
        { id: 'reformasi-birokrasi', name: 'Reformasi Birokrasi' },
    ];

    // Load data on mount and update time every minute
    useEffect(() => {
        loadData();

        // Update time every minute
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timeInterval);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const events = await getCalendarEvents();
            const plans = await getAllWorkPlans();
            setAllWorkPlans(plans);

            // Combine calendar events and work plans for the "Upcoming" list
            const workPlanEvents = Object.entries(plans).flatMap(([sectionId, sectionPlans]) => {
                const sectionName = sections.find(s => s.id === sectionId)?.name || sectionId;
                return sectionPlans
                    .filter(p => p.status !== 'completed')
                    .map(p => ({
                        id: `wp-${sectionId}-${p.id}`,
                        originalId: p.id,
                        sectionId: sectionId,
                        date: p.deadline,
                        title: p.title,
                        section: sectionName,
                        status: p.status === 'ongoing' ? 'ongoing' : 'upcoming',
                        isWorkPlan: true
                    }));
            });

            const combined = [...events, ...workPlanEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
            setCalendarEvents(combined);

            // Calculate section budgets
            const budgetPromises = sections.map(async section => {
                const budget = await calculateSectionBudget(section.id);
                return {
                    name: section.name,
                    ...budget
                };
            });
            const budgets = await Promise.all(budgetPromises);
            setSectionBudgets(budgets);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const showSaveStatus = (message) => {
        setSaveStatus(message);
        setTimeout(() => setSaveStatus(''), 2000);
    };

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) {
            return { text: 'Selamat Pagi', icon: 'pagi', period: 'pagi' };
        } else if (hour >= 12 && hour < 15) {
            return { text: 'Selamat Siang', icon: 'siang', period: 'siang' };
        } else if (hour >= 15 && hour < 18) {
            return { text: 'Selamat Sore', icon: 'sore', period: 'sore' };
        } else {
            return { text: 'Selamat Malam', icon: 'malam', period: 'malam' };
        }
    };

    // Format current date
    const formatCurrentDate = () => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const day = days[currentTime.getDay()];
        const date = currentTime.getDate();
        const month = months[currentTime.getMonth()];
        const year = currentTime.getFullYear();
        return `${day}, ${date} ${month} ${year}`;
    };

    // Format time
    const formatTime = () => {
        return currentTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const greeting = getGreeting();

    // Budget data calculated from sectionBudgets state
    const totalPagu = sectionBudgets.reduce((sum, s) => sum + (s.totalPagu || 0), 0);
    const terpakai = sectionBudgets.reduce((sum, s) => sum + (s.terpakai || 0), 0);
    const sisa = totalPagu - terpakai;

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = calendarEvents.some(event => event.date === dateStr);
            const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
            const isSelected = selectedDate === dateStr;

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${hasEvent ? 'has-event' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                >
                    <span className="day-number">{day}</span>
                    {hasEvent && <span className="event-dot"></span>}
                </div>
            );
        }

        return days;
    };

    const usedPercentage = totalPagu > 0 ? (terpakai / totalPagu) * 100 : 0;

    // Calculate All Work Plans statistics for Status Section
    const flattenedWorkPlans = Object.entries(allWorkPlans).flatMap(([sectionId, plans]) =>
        plans.map(p => ({
            ...p,
            sectionId,
            sectionName: sections.find(s => s.id === sectionId)?.name || sectionId
        }))
    );

    const dashboardStatusCounts = {
        completed: flattenedWorkPlans.filter(wp => wp.status === 'completed').length,
        ongoing: flattenedWorkPlans.filter(wp => wp.status === 'ongoing').length,
        pending: flattenedWorkPlans.filter(wp => wp.status === 'pending').length,
    };

    const dashboardCompletedPercentage = flattenedWorkPlans.length > 0
        ? Math.round((dashboardStatusCounts.completed / flattenedWorkPlans.length) * 100)
        : 0;

    // Event handlers
    const handleAddEvent = async () => {
        if (!newEvent.title.trim() || !newEvent.date) {
            alert('Judul dan tanggal wajib diisi!');
            return;
        }
        try {
            const event = await addCalendarEvent(newEvent);
            if (event) {
                setCalendarEvents([...calendarEvents, event]);
                setNewEvent({ date: '', title: '', section: 'Tikim', status: 'upcoming' });
                setShowAddEvent(false);
                showSaveStatus('[OK] Jadwal berhasil ditambahkan ke database!');
            }
        } catch (error) {
            console.error('Error adding event:', error);
            showSaveStatus('[ERROR] Gagal menambahkan jadwal!');
        }
    };

    const handleEditStart = (event) => {
        setEditingEventId(event.id);
        setEditEvent({ ...event });
    };

    const handleEditSave = async () => {
        try {
            if (typeof editingEventId === 'string' && editingEventId.startsWith('wp-')) {
                const parts = editingEventId.split('-');
                const sectionId = parts[1];
                const originalId = parseInt(parts[2]);
                await updateWorkPlan(sectionId, originalId, {
                    title: editEvent.title,
                    deadline: editEvent.date
                });
                showSaveStatus('[OK] Rencana kegiatan diperbarui di database!');
            } else {
                await updateCalendarEvent(editingEventId, editEvent);
                showSaveStatus('[OK] Perubahan tersimpan ke database!');
            }
            await loadData();
            setEditingEventId(null);
            setEditEvent({});
        } catch (error) {
            console.error('Error saving event:', error);
            showSaveStatus('[ERROR] Gagal menyimpan perubahan!');
        }
    };

    const handleEditCancel = () => {
        setEditingEventId(null);
        setEditEvent({});
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            try {
                if (typeof eventId === 'string' && eventId.startsWith('wp-')) {
                    const parts = eventId.split('-');
                    const sectionId = parts[1];
                    const originalId = parseInt(parts[2]);
                    await deleteWorkPlan(sectionId, originalId);
                    showSaveStatus('[OK] Rencana kegiatan berhasil dihapus dari database!');
                } else {
                    await deleteCalendarEvent(eventId);
                    showSaveStatus('[OK] Jadwal berhasil dihapus dari database!');
                }
                await loadData();
            } catch (error) {
                console.error('Error deleting event:', error);
                showSaveStatus('[ERROR] Gagal menghapus jadwal!');
            }
        }
    };

    return (
        <div className="dashboard">
            {/* Save Status Toast */}
            {saveStatus && (
                <div className="save-toast">
                    {saveStatus}
                </div>
            )}

            {/* Header - Greeting */}
            <div className={`dashboard-header greeting-${greeting.period}`}>
                <div className="greeting-icon"><FlatIcon name={greeting.icon} size={32} /></div>
                <div className="greeting-content">
                    <h1>{greeting.text}, Admin!</h1>
                    <p>{formatCurrentDate()}</p>
                </div>
                <div className="header-time">
                    <span className="time-display">{formatTime()}</span>
                    <span className="time-label">WIB</span>
                </div>
            </div>

            {/* Budget Overview */}
            <div className="budget-overview">
                <h2><FlatIcon name="wallet" size={18} /> Ringkasan Anggaran</h2>
                <div className="budget-cards">
                    <div className="budget-card total">
                        <div className="budget-icon"><FlatIcon name="chart" size={22} /></div>
                        <div className="budget-info">
                            <span className="budget-label">Total Pagu</span>
                            <span className="budget-value">{formatCurrency(totalPagu)}</span>
                        </div>
                    </div>
                    <div className="budget-card used">
                        <div className="budget-icon"><FlatIcon name="wallet" size={22} /></div>
                        <div className="budget-info">
                            <span className="budget-label">Terpakai</span>
                            <span className="budget-value">{formatCurrency(terpakai)}</span>
                        </div>
                    </div>
                    <div className="budget-card remaining">
                        <div className="budget-icon"><FlatIcon name="shield" size={22} /></div>
                        <div className="budget-info">
                            <span className="budget-label">Sisa Anggaran</span>
                            <span className="budget-value">{formatCurrency(sisa)}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="budget-progress-container">
                    <div className="progress-header">
                        <span>Penggunaan Anggaran</span>
                        <span className="progress-percentage">{usedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${usedPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Calendar Section */}
                <div className="calendar-section">
                    <div className="calendar-header">
                        <button className="nav-btn" onClick={prevMonth}>❮</button>
                        <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                        <button className="nav-btn" onClick={nextMonth}>❯</button>
                    </div>
                    <div className="calendar-grid">
                        {dayNames.map(day => (
                            <div key={day} className="calendar-day-name">{day}</div>
                        ))}
                        {renderCalendar()}
                    </div>
                    <div className="calendar-legend">
                        <span className="legend-item"><span className="legend-dot today"></span> Hari ini</span>
                        <span className="legend-item"><span className="legend-dot event"></span> Ada kegiatan</span>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="events-section">
                    <div className="events-header">
                        <h3><FlatIcon name="calendar" size={16} /> Rencana Kerja Mendatang</h3>
                        {selectedDate && (
                            <button className="clear-filter-btn" onClick={() => setSelectedDate(null)}>
                                Tampilkan Semua
                            </button>
                        )}
                    </div>

                    <div className="events-list">
                        {(selectedDate
                            ? calendarEvents.filter(e => e.date === selectedDate)
                            : calendarEvents
                        ).map(event => (
                            <div key={event.id} className={`event-card ${event.status}`}>
                                <div className="event-date">
                                    <span className="date-day">{new Date(event.date + 'T00:00:00').getDate()}</span>
                                    <span className="date-month">{monthNames[new Date(event.date + 'T00:00:00').getMonth()].slice(0, 3)}</span>
                                </div>
                                <div className="event-info">
                                    <h4>{event.title}</h4>
                                    <span className="event-section">{event.section}</span>
                                </div>
                                <div className="event-controls">
                                    <span className={`event-status ${event.status}`}>
                                        {event.status === 'ongoing' ? 'Berlangsung' : 'Akan Datang'}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {(selectedDate ? calendarEvents.filter(e => e.date === selectedDate) : calendarEvents).length === 0 && (
                            <div className="empty-events">
                                <span><FlatIcon name="mailbox" size={28} /></span>
                                <p>{selectedDate ? `Tidak ada kegiatan pada tanggal ${selectedDate}` : 'Belum ada jadwal rencana kegiatan.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section Budget Breakdown */}
            <div className="section-budgets">
                <h3><FlatIcon name="chart" size={16} /> Anggaran per Seksi</h3>
                <div className="section-budget-grid">
                    {sectionBudgets.map((section, index) => (
                        <div key={index} className="section-budget-card">
                            <div className="section-info">
                                <h4>{section.name}</h4>
                                <div className="section-amounts">
                                    <span className="pagu">Pagu: {formatCurrency(section.totalPagu)}</span>
                                    <span className="terpakai">Terpakai: {formatCurrency(section.terpakai)}</span>
                                </div>
                            </div>
                            <div className="section-progress">
                                <div className="mini-progress-bar">
                                    <div
                                        className="mini-progress-fill"
                                        style={{ width: `${section.progress}%` }}
                                    ></div>
                                </div>
                                <span className="section-percentage">{section.progress.toFixed(0)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Kegiatan Section */}
            <div className="status-kegiatan-section">
                <div className="status-kegiatan-header-title">
                    <span className="icon"><FlatIcon name="chart" size={16} /></span> Status Kegiatan
                </div>

                <div className="overall-progress-card">
                    <div className="progress-top">
                        <span className="progress-label">Progress Keseluruhan</span>
                        <span className="progress-percent">{dashboardCompletedPercentage}%</span>
                    </div>
                    <div className="progress-bar-main">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${dashboardCompletedPercentage}%` }}
                        ></div>
                    </div>
                    <div className="progress-footer">
                        <span>{dashboardStatusCounts.completed} selesai</span>
                        <span>{flattenedWorkPlans.length} total</span>
                    </div>
                </div>

                {/* Selesai */}
                <div className="status-group">
                    <div className="group-header">
                        <div className="group-title">
                            <span className="status-icon success"><FlatIcon name="check" size={16} /></span> Selesai
                        </div>
                        <span className="group-count success">{dashboardStatusCounts.completed}</span>
                    </div>
                    <div className="status-list">
                        {flattenedWorkPlans.filter(wp => wp.status === 'completed').map(wp => (
                            <div key={`comp-${wp.id}-${wp.sectionId}`} className="status-item-card success">
                                <div className="item-icon"><FlatIcon name="scale" size={16} /></div>
                                <div className="item-details">
                                    <div className="item-title">{wp.title}</div>
                                    <div className="item-meta">{wp.sectionName.toUpperCase()} • {wp.deadline}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sedang Berjalan */}
                <div className="status-group">
                    <div className="group-header">
                        <div className="group-title">
                            <span className="status-icon warning"><FlatIcon name="hourglass" size={16} /></span> Sedang Berjalan
                        </div>
                        <span className="group-count warning">{dashboardStatusCounts.ongoing}</span>
                    </div>
                    <div className="status-list">
                        {flattenedWorkPlans.filter(wp => wp.status === 'ongoing').map(wp => (
                            <div key={`ong-${wp.id}-${wp.sectionId}`} className="status-item-card warning">
                                <div className="item-icon"><FlatIcon name="refresh" size={16} /></div>
                                <div className="item-details">
                                    <div className="item-title">{wp.title}</div>
                                    <div className="item-meta">{wp.sectionName.toUpperCase()} • {wp.deadline}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rencana */}
                <div className="status-group">
                    <div className="group-header">
                        <div className="group-title">
                            <span className="status-icon pending"><FlatIcon name="clipboard" size={16} /></span> Rencana
                        </div>
                        <span className="group-count pending">{dashboardStatusCounts.pending}</span>
                    </div>
                    <div className="status-list">
                        {flattenedWorkPlans.filter(wp => wp.status === 'pending').map(wp => (
                            <div key={`pen-${wp.id}-${wp.sectionId}`} className="status-item-card pending">
                                <div className="item-icon"><FlatIcon name="traffic-light" size={16} /></div>
                                <div className="item-details">
                                    <div className="item-title">{wp.title}</div>
                                    <div className="item-meta">{wp.sectionName.toUpperCase()} • {wp.deadline}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
