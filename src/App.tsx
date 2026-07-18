/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { useTheme } from './theme/ThemeContext';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicPortal } from './pages/PublicPortal';
import { AdminLayout } from './pages/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { QRScanner } from './pages/QRScanner';
import { Members } from './pages/Members';
import { Attendance } from './pages/Attendance';
import { Settings } from './pages/Settings';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const { theme } = useTheme(); // just to ensure context is valid here if needed
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  return (
    <>
      {isAppLoading && (
        <LoadingScreen duration={1400} onFinished={() => setIsAppLoading(false)} />
      )}
      <HashRouter>
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
      </HashRouter>
    </>
  );
}
