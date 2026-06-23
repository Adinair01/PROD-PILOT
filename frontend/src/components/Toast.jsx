import { useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/Toast.css';

/**
 * Transient notification. `type` switches between success and error styling so
 * failed actions are never shown with a success affordance.
 */
export default function Toast({ message, onClose, duration = 3500, type = 'success' }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isError = type === 'error';

  return (
    <div className="toast-container">
      <div className={`toast ${isError ? 'toast--error' : ''}`}>
        <div className="toast-icon">
          {isError ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-cool-btn" onClick={onClose}>
          {isError ? 'Dismiss' : 'Cool'}
        </button>
      </div>
    </div>
  );
}
