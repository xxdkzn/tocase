import { useToastContext } from '../contexts/ToastContext';
import { ToastType } from '../components/Toast';

export const useToast = () => {
  const { showToast } = useToastContext();

  return {
    showToast: (message: string, type: ToastType = 'info') => {
      showToast(message, type);
    },
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    info: (message: string) => showToast(message, 'info'),
    warning: (message: string) => showToast(message, 'warning'),
  };
};
