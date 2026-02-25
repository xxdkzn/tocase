import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminCasesPage from './admin/AdminCasesPage';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminNFTDataPage from './admin/AdminNFTDataPage';

const AdminPage = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="cases" element={<AdminCasesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="nft-data" element={<AdminNFTDataPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminPage;
