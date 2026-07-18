import React from 'react';
import { useStore } from '../store/store';
import { Users, UserCheck, UserPlus, Clock } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

export function Dashboard() {
  const members = useStore(state => state.members);
  const attendance = useStore(state => state.attendanceRecords);
  
  const todayAttendance = attendance.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length;
  const weeklyAttendance = attendance.filter(a => isThisWeek(new Date(a.date))).length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const newMembers = members.filter(m => isThisMonth(new Date(m.registrationDate))).length;

  const stats = [
    { title: "Total Members", value: members.length, icon: <Users size={24} className="text-[#0A3D91]" />, bg: "bg-blue-50" },
    { title: "Today's Attendance", value: todayAttendance, icon: <UserCheck size={24} className="text-green-600" />, bg: "bg-green-50" },
    { title: "Weekly Attendance", value: weeklyAttendance, icon: <Clock size={24} className="text-orange-600" />, bg: "bg-orange-50" },
    { title: "New Members (Month)", value: newMembers, icon: <UserPlus size={24} className="text-purple-600" />, bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-bg-card p-6 rounded-2xl shadow-sm border border-border-main flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{s.title}</p>
              <p className="text-3xl font-black mt-2 text-[#0A3D91] dark:text-blue-400">{s.value}</p>
            </div>
            <div className={`w-14 h-14 ${s.bg} dark:bg-opacity-10 rounded-full flex items-center justify-center`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card rounded-2xl shadow-sm border border-border-main p-6">
          <h3 className="font-bold text-lg mb-4">Recent Attendance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-bg-main">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Member</th>
                  <th className="px-4 py-3">Locale</th>
                  <th className="px-4 py-3">Gathering</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 rounded-tr-lg">Health</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 5).map(record => (
                  <tr key={record.id} className="border-b border-border-main last:border-0 hover:bg-bg-main transition-colors">
                    <td className="px-4 py-4 font-bold">{record.fullName}</td>
                    <td className="px-4 py-4">{record.locale}</td>
                    <td className="px-4 py-4 text-blue-600 dark:text-blue-400">{record.gatheringType}</td>
                    <td className="px-4 py-4">{record.time}</td>
                    <td className="px-4 py-4">
                      {record.healthDeclaration ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] rounded-full font-bold uppercase">Clear</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] rounded-full font-bold uppercase">Flagged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && <div className="p-8 text-center text-text-muted">No attendance records yet.</div>}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl shadow-sm border border-border-main p-6">
          <h3 className="font-bold text-lg mb-4">Upcoming Birthdays</h3>
          <div className="space-y-4">
            {members.filter(m => isThisMonth(new Date(m.birthdate))).slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center space-x-4 p-3 bg-bg-main rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                  {m.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm">{m.fullName}</p>
                  <p className="text-xs text-text-muted">{format(new Date(m.birthdate), 'MMMM do')}</p>
                </div>
              </div>
            ))}
            {members.length === 0 && <div className="text-sm text-text-muted text-center py-4">No members registered.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
