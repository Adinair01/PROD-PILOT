import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import '../styles/Toast.css';

export default function Toast({ message, onClose, duration = 3500 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast-container">
      <div className="toast">
        <div className="toast-icon">
          <CheckCircle size={24} />
        </div>
        <div className="toast-message">{message}</div>
        <button className="toast-cool-btn" onClick={onClose}>
          Cool
        </button>
      </div>
    </div>
  );
}
