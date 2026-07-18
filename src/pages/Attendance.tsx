import React, { useState } from 'react';
import { useStore } from '../store/store';
import { Download } from 'lucide-react';

export function Attendance() {
  const attendance = useStore(state => state.attendanceRecords);
  const locales = useStore(state => state.locales);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocaleFilter, setSelectedLocaleFilter] = useState('');

  const filteredAttendance = attendance
    .filter(a => {
      if (!selectedLocaleFilter) return true;
      return a.locale === selectedLocaleFilter;
    })
    .filter(a => {
      if (!searchQuery) return true;
      return (
        a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.locale.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.gatheringType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Member', 'Locale', 'Gathering', 'Batch', 'Latitude', 'Longitude'];
    const rows = filteredAttendance.map(a => [
      a.date,
      a.time,
      a.fullName,
      a.locale,
      a.gatheringType,
      a.batch,
      a.latitude || '',
      a.longitude || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-bg-card rounded-2xl shadow-sm border border-border-main p-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Attendance Records</h2>
          <p className="text-xs text-text-muted">Filtered: {filteredAttendance.length} of {attendance.length} records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search attendance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border border-border-main bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 w-full sm:w-44"
          />
          <select
            value={selectedLocaleFilter}
            onChange={(e) => setSelectedLocaleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border border-border-main bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 font-semibold text-text-main w-full sm:w-auto"
          >
            <option value="">All Locales</option>
            {locales.map(l => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-[#0A3D91] hover:bg-[#072d6b] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto justify-center"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-bg-main sticky top-0 shadow-sm">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Locale</th>
              <th className="px-4 py-3">Gathering</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3 rounded-tr-lg">GPS</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map(a => (
              <tr key={a.id} className="border-b border-border-main hover:bg-bg-main transition-colors">
                <td className="px-4 py-4">{a.date}</td>
                <td className="px-4 py-4 font-mono text-xs">{a.time}</td>
                <td className="px-4 py-4 font-bold">{a.fullName}</td>
                <td className="px-4 py-4">{a.locale}</td>
                <td className="px-4 py-4 text-blue-600 dark:text-blue-400">{a.gatheringType}</td>
                <td className="px-4 py-4">{a.batch}</td>
                <td className="px-4 py-4 text-[10px] text-text-muted">
                  {a.latitude ? `${a.latitude.toFixed(4)}, ${a.longitude?.toFixed(4)}` : 'N/A'}
                </td>
              </tr>
            ))}
            {filteredAttendance.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-text-muted">No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
