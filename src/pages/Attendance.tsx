import React from 'react';
import { useStore } from '../store/store';
import { Download } from 'lucide-react';

export function Attendance() {
  const attendance = useStore(state => state.attendanceRecords);

  return (
    <div className="bg-bg-card rounded-2xl shadow-sm border border-border-main p-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Attendance Records</h2>
        <button className="flex items-center space-x-2 bg-[#0A3D91] hover:bg-[#072d6b] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
          <Download size={16} />
          <span>Export CSV</span>
        </button>
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
            {attendance.map(a => (
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
            {attendance.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-text-muted">No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
