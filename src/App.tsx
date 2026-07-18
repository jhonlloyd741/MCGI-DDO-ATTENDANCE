/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useTheme } from './theme/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicPortal } from './pages/PublicPortal';
import { AdminLayout } from './pages/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { QRScanner } from './pages/QRScanner';
import { Members } from './pages/Members';
import { Attendance } from './pages/Attendance';
import { Settings } from './pages/Settings';

export default function App() {
  const { theme } = useTheme(); // just to ensure context is valid here if needed
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPortal />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="scanner" element={<QRScanner />} />
          <Route path="members" element={<Members />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="/reports" element={<Navigate to="/admin/attendance" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
