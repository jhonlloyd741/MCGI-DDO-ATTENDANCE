import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useStore, Member, AttendanceRecord } from '../store/store';
import { format } from 'date-fns';

export function PublicPortal() {
  const { theme, setTheme } = useTheme();
  const addMember = useStore(state => state.addMember);
  const addAttendance = useStore(state => state.addAttendance);
  const members = useStore(state => state.members);
  const locales = useStore(state => state.locales).filter(l => l.status === 'Active');
  const gatheringTypes = useStore(state => state.gatheringTypes).filter(g => g.status === 'Open');
  const allAttendanceRecords = useStore(state => state.attendanceRecords);
  const recentAttendance = allAttendanceRecords.slice(0, 5);
  
  const isOnline = useStore(state => state.isOnline);
  const syncStatus = useStore(state => state.syncStatus);
  const pendingSyncCount = useStore(state => state.pendingSyncCount);
  const syncData = useStore(state => state.syncData);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    birthdate: '',
    gender: 'Male',
    baptismDate: '',
    noBaptismDate: false,
    contactNumber: '',
    locale: locales.length > 0 ? locales[0].name : '',
    address: '',
    gatheringType: gatheringTypes.length > 0 ? gatheringTypes[0].name : '',
    batch: 'Live',
    medicalCondition: false,
    conditionDetails: '',
    maintenanceMedicine: false,
    medicineName: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    healthDeclaration: false,
  });

  const [location, setLocation] = useState<{lat: number, lng: number, secured: boolean}>({ lat: 0, lng: 0, secured: false });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, secured: true }),
        (err) => console.log('Location error', err)
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.healthDeclaration) {
      alert("Please check the health declaration.");
      return;
    }

    let member = members.find(m => m.fullName.toLowerCase() === formData.fullName.toLowerCase() && m.baptismDate === formData.baptismDate);
    
    if (!member) {
      member = {
        id: uuidv4(),
        fullName: formData.fullName,
        birthdate: '', // Provide empty birthdate as it's no longer collected
        gender: formData.gender,
        baptismDate: formData.baptismDate,
        contactNumber: formData.contactNumber,
        locale: formData.locale,
        address: formData.address,
        medicalCondition: formData.medicalCondition,
        conditionDetails: formData.conditionDetails,
        maintenanceMedicine: formData.maintenanceMedicine,
        medicineName: formData.medicineName,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        status: 'Active',
        registrationDate: new Date().toISOString()
      };
      addMember(member);
    }

    const attendance: AttendanceRecord = {
      id: uuidv4(),
      memberId: member.id,
      fullName: member.fullName,
      locale: member.locale,
      gatheringType: formData.gatheringType,
      batch: formData.batch,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm:ss'),
      latitude: location.lat,
      longitude: location.lng,
      healthDeclaration: formData.healthDeclaration
    };

    addAttendance(attendance);
    alert('Attendance Successfully Submitted!\nRef: ' + attendance.id.substring(0, 8).toUpperCase());
    
    setFormData(prev => ({
      ...prev,
      fullName: '',
      baptismDate: '',
      contactNumber: '',
      address: '',
      healthDeclaration: false
    }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-bg-main text-text-main overflow-hidden font-sans transition-colors duration-200">
      <header className="bg-[#0A3D91] dark:bg-[#062456] text-white p-4 flex justify-between items-center border-b-4 border-[#FFD700] shadow-lg shrink-0 transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#0A3D91] font-black">MCGI</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DAVAO DE ORO ATTENDANCE</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-300">Enterprise Management System v2.0</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs text-slate-300">Current Date/Time</p>
            <p className="text-sm font-mono text-[#FFD700]">{format(currentTime, 'MMM dd, yyyy | HH:mm:ss')}</p>
          </div>
          <div className="flex space-x-2 items-center">
            {!isOnline ? (
              <span className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg text-[10px] border border-amber-500/30 shadow-sm" title="Your inputs will be stored on your device and uploaded automatically once you are connected to Wifi or Mobile Data.">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                <span className="font-bold">OFFLINE MODE (SAFE)</span>
              </span>
            ) : syncStatus === 'syncing' ? (
              <span className="flex items-center space-x-1.5 bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg text-[10px] border border-blue-500/30 animate-pulse">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-spin"></span>
                <span className="font-bold">SYNCING ({pendingSyncCount} PENDING)</span>
              </span>
            ) : (
              <div className="flex items-center space-x-2">
                {pendingSyncCount > 0 && (
                  <button 
                    onClick={() => syncData()}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[9px] font-black uppercase tracking-wider animate-bounce"
                    title="Click to manually push pending local changes to the cloud"
                  >
                    Sync {pendingSyncCount} Records
                  </button>
                )}
                <span className="flex items-center space-x-1.5 bg-green-500/20 text-green-400 px-2.5 py-1 rounded-lg text-[10px] border border-green-500/30 shadow-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-bold">CLOUD CONNECTED & SYNCED</span>
                </span>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-2 p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[60%] p-6 overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit} className="bg-bg-card rounded-2xl shadow-xl border border-border-main flex flex-col h-full transition-colors duration-200">
            <div className="p-5 border-b border-border-main flex justify-between items-center bg-black/5 dark:bg-white/5">
              <div>
                <h2 className="text-lg font-bold text-[#0A3D91] dark:text-blue-400">Public Attendance Form</h2>
                <p className="text-xs text-text-muted">Please enter your details accurately for record verification.</p>
              </div>
              <div className="bg-[#0A3D91] text-[#FFD700] p-2 rounded-lg shadow-inner">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"/></svg>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name *</label>
                  <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} type="text" placeholder="Juan Dela Cruz" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 transition-colors duration-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Baptism Date *</label>
                  <input required value={formData.baptismDate} onChange={e => setFormData({...formData, baptismDate: e.target.value})} type="date" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 transition-colors duration-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gender *</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main transition-colors duration-200">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Contact Number</label>
                  <input value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} type="tel" placeholder="09xxxxxxxxx" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main transition-colors duration-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Locale *</label>
                  <select value={formData.locale} onChange={e => setFormData({...formData, locale: e.target.value})} className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main transition-colors duration-200">
                    {locales.map(l => (
                      <option key={l.id} value={l.name}>{l.name} ({l.district})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Complete Address *</label>
                  <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" placeholder="123 Street Name, Brgy, City" className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main transition-colors duration-200" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-border-main pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gathering Type</label>
                  <select value={formData.gatheringType} onChange={e => setFormData({...formData, gatheringType: e.target.value})} className="w-full border border-border-main p-2.5 rounded-lg text-sm bg-bg-main font-bold text-[#0A3D91] dark:text-blue-400 transition-colors duration-200">
                    {gatheringTypes.map(g => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Batch</label>
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => setFormData({...formData, batch: 'Live'})} className={`flex-1 py-2 text-xs rounded-md border ${formData.batch === 'Live' ? 'bg-[#0A3D91] text-white border-[#0A3D91]' : 'bg-bg-card text-text-muted border-border-main'}`}>Live</button>
                    <button type="button" onClick={() => setFormData({...formData, batch: '2nd Batch'})} className={`flex-1 py-2 text-xs rounded-md border ${formData.batch === '2nd Batch' ? 'bg-[#0A3D91] text-white border-[#0A3D91]' : 'bg-bg-card text-text-muted border-border-main'}`}>2nd</button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">GPS Access</label>
                  <div className={`flex items-center space-x-2 p-2 rounded-lg border ${location.secured ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-orange-50 border-orange-200'}`}>
                    <span className={location.secured ? "text-green-600 dark:text-green-400" : "text-orange-500"}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg></span>
                    <span className={`text-[10px] font-bold ${location.secured ? "text-green-700 dark:text-green-400" : "text-orange-600"}`}>{location.secured ? 'SECURED' : 'PENDING'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-bg-main border border-dashed border-border-main rounded-xl transition-colors duration-200">
                <div className="flex items-start space-x-3">
                  <input required checked={formData.healthDeclaration} onChange={e => setFormData({...formData, healthDeclaration: e.target.checked})} type="checkbox" className="mt-1 w-4 h-4 rounded text-[#0A3D91]" />
                  <div>
                    <p className="text-xs font-semibold uppercase">Health Declaration</p>
                    <p className="text-[10px] text-text-muted">I confirm that I do not have any respiratory symptoms or medical conditions that require special assistance today.</p>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#0A3D91] hover:bg-[#072d6b] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
                <span>SUBMIT ATTENDANCE</span>
                <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </form>
        </div>

        <div className="w-[40%] p-6 pl-0 flex flex-col space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-card p-4 rounded-2xl shadow border border-border-main flex items-center justify-between transition-colors duration-200">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Attendance Today</p>
                <p className="text-2xl font-black text-[#0A3D91] dark:text-blue-400">{useStore(state => state.attendanceRecords.length)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-[#0A3D91] dark:text-blue-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
              </div>
            </div>
            <div className="bg-bg-card p-4 rounded-2xl shadow border border-border-main flex items-center justify-between transition-colors duration-200">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Members</p>
                <p className="text-2xl font-black text-[#0A3D91] dark:text-blue-400">{members.length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl shadow border border-border-main flex flex-col flex-1 overflow-hidden transition-colors duration-200">
            <div className="p-4 border-b border-border-main flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>LIVE ATTENDANCE FEED</span>
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="space-y-2">
                {recentAttendance.map((record, i) => (
                  <div key={record.id} className={`p-3 rounded-xl border flex items-center space-x-3 transition-colors duration-200 ${i === 0 ? 'bg-bg-main border-border-main' : 'bg-bg-card border-border-main opacity-80'}`}>
                    <div className="w-8 h-8 rounded-full bg-[#0A3D91] text-white flex items-center justify-center text-[10px] font-bold">
                      {record.fullName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">{record.fullName}</p>
                      <p className="text-[10px] text-text-muted">{record.locale} • <span className="text-blue-600 dark:text-blue-400">{record.gatheringType}</span></p>
                    </div>
                    <p className="text-[10px] font-mono text-text-muted">{record.time.substring(0,5)}</p>
                  </div>
                ))}
                {recentAttendance.length === 0 && (
                  <div className="p-4 text-center text-xs text-text-muted">No recent attendance.</div>
                )}
              </div>
            </div>
            <div className="p-4 bg-bg-main border-t border-border-main flex items-center justify-center space-x-2 transition-colors duration-200">
              <Link to="/admin/scanner" className="w-full bg-[#FFD700] p-3 rounded-xl flex items-center justify-between cursor-pointer group hover:shadow-md transition-all">
                <span className="text-xs font-black text-[#0A3D91] tracking-tighter">SCAN MEMBER QR CODE</span>
                <svg className="w-6 h-6 text-[#0A3D91]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0-2h2v2h-2zm2 2h2v2h-2z"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-bg-card border-t border-border-main px-6 py-3 flex justify-between items-center shrink-0 transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">© 2023 MCGI Davao De Oro • District Management</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/admin" className="flex items-center space-x-2 px-4 py-1.5 rounded-full border border-border-main bg-bg-card hover:bg-bg-main transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <span className="text-xs font-bold uppercase tracking-tight">Admin Panel</span>
          </Link>
          <Link to="/reports" className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#0A3D91] text-white shadow-md hover:shadow-lg transition-all">
            <svg className="w-4 h-4 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span className="text-xs font-bold uppercase tracking-tight">Reports</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
