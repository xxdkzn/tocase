import { useState } from 'react';
import Button from '../Button';
import apiClient from '../../services/api';
import { CaseConfiguration } from '../../types/admin';

interface ConfigurationManagerProps {
  caseId: number;
  caseName: string;
}

const ConfigurationManager = ({ caseId, caseName }: ConfigurationManagerProps) => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.get<CaseConfiguration>(
        `/admin/cases/${caseId}/export`
      );

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-${caseId}-${caseName.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Configuration exported successfully!');
    } catch (err: any) {
      console.error('Failed to export configuration:', err);
      setError(err.response?.data?.message || 'Failed to export configuration');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setSuccess(null);

      // Read file content
      const fileContent = await file.text();
      const configJson = JSON.parse(fileContent);

      // Validate basic structure
      if (!configJson.case || !configJson.nfts) {
        throw new Error('Invalid configuration file format');
      }

      // Import configuration
      const response = await apiClient.post<{ caseId: number }>('/admin/cases/import', {
        configJson,
      });

      setSuccess(`Configuration imported successfully! New case ID: ${response.data.caseId}`);
      
      // Reset file input
      event.target.value = '';
    } catch (err: any) {
      console.error('Failed to import configuration:', err);
      if (err instanceof SyntaxError) {
        setError('Invalid JSON file');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to import configuration');
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Configuration Management</h3>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleExport}
          loading={exporting}
          variant="secondary"
          className="flex-1"
        >
          📥 Export Configuration
        </Button>

        <div className="flex-1">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
            id={`import-config-${caseId}`}
          />
          <label htmlFor={`import-config-${caseId}`} className="block">
            <div
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-center ${
                importing
                  ? 'bg-transparent border-2 border-white/30 text-white opacity-50 cursor-not-allowed'
                  : 'bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50'
              }`}
            >
              {importing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>📤 Import Configuration</>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>• Export: Download case configuration as JSON file</p>
        <p>• Import: Upload JSON file to create a new case with the same configuration</p>
      </div>
    </div>
  );
};

export default ConfigurationManager;
