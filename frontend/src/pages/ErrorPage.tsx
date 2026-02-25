import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  message?: string;
}

const ErrorPage = ({ message = 'Authentication failed. Please try again.' }: ErrorPageProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-400 mb-6">{message}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
