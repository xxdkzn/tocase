import { useEffect, useState, lazy, Suspense } from 'react';
import apiClient from '../../services/api';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfigurationManager from '../../components/admin/ConfigurationManager';
import { AdminCase } from '../../types/admin';

// Lazy load the heavy modal component
const CaseEditorModal = lazy(() => import('../../components/admin/CaseEditorModal'));

const AdminCasesPage = () => {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<AdminCase | null>(null);

  const fetchCases = async () => {
    try {
      setError(null);
      // Fetch all cases (enabled and disabled)
      const response = await apiClient.get<AdminCase[]>('/cases');
      setCases(response.data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleToggleEnabled = async (caseId: number, currentEnabled: boolean) => {
    try {
      await apiClient.put(`/admin/cases/${caseId}`, { enabled: !currentEnabled });
      await fetchCases();
    } catch (err) {
      console.error('Failed to toggle case:', err);
      alert('Failed to update case status');
    }
  };

  const handleCreateCase = () => {
    setEditingCase(null);
    setEditorOpen(true);
  };

  const handleEditCase = (caseItem: AdminCase) => {
    setEditingCase(caseItem);
    setEditorOpen(true);
  };

  const handleSaveSuccess = () => {
    setEditorOpen(false);
    setEditingCase(null);
    fetchCases();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Cases Management</h1>
        <Button onClick={handleCreateCase}>
          ➕ Create Case
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {cases.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">No cases found</p>
          <Button onClick={handleCreateCase}>Create Your First Case</Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((caseItem) => (
            <GlassCard key={caseItem.id} className="p-6">
              {caseItem.imageUrl && (
                <img
                  src={caseItem.imageUrl}
                  alt={caseItem.name}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{caseItem.name}</h3>
                  {caseItem.description && (
                    <p className="text-gray-400 text-sm mt-1">{caseItem.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-semibold">{caseItem.price.toFixed(2)} 💰</span>
                </div>

                {caseItem.nftCount !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">NFTs:</span>
                    <span className="text-white font-semibold">{caseItem.nftCount}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      caseItem.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {caseItem.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <ConfigurationManager caseId={caseItem.id} caseName={caseItem.name} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleEditCase(caseItem)}
                    variant="secondary"
                    className="flex-1 text-sm py-2"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    onClick={() => handleToggleEnabled(caseItem.id, caseItem.enabled)}
                    variant={caseItem.enabled ? 'danger' : 'primary'}
                    className="flex-1 text-sm py-2"
                  >
                    {caseItem.enabled ? '🚫 Disable' : '✅ Enable'}
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {editorOpen && (
        <Suspense fallback={<LoadingSpinner />}>
          <CaseEditorModal
            isOpen={editorOpen}
            onClose={() => setEditorOpen(false)}
            caseData={editingCase}
            onSaveSuccess={handleSaveSuccess}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AdminCasesPage;
