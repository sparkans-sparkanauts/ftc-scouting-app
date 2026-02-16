'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { 
  getStoredCredentials, 
  saveCredentials, 
  clearCredentials,
  validateCredentials 
} from '@/lib/ftc-api';

export default function AdminSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = getStoredCredentials();
    if (stored) {
      setUsername(stored.username);
      setAuthKey(stored.authKey);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!username.trim() || !authKey.trim()) {
      setMessage('Please enter both username and auth key');
      setValidationStatus('error');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setMessage('Validating credentials...');

    const isValid = await validateCredentials(username, authKey);

    if (isValid) {
      saveCredentials(username, authKey);
      setValidationStatus('success');
      setMessage('Credentials saved successfully!');
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload(); // Reload to fetch data with new credentials
      }, 1500);
    } else {
      setValidationStatus('error');
      setMessage('Invalid credentials. Please check and try again.');
    }

    setIsValidating(false);
  };

  const handleClear = () => {
    clearCredentials();
    setUsername('');
    setAuthKey('');
    setValidationStatus('idle');
    setMessage('Credentials cleared');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 cyber-button-secondary flex items-center gap-2"
        title="Admin Settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Admin</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="cyber-card max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display text-cyber-blue glow-text">
                Admin Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  FTC API Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your FTC API username"
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Auth Key
                </label>
                <div className="relative">
                  <input
                    type={showAuthKey ? 'text' : 'password'}
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    placeholder="Enter your auth key"
                    className="cyber-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthKey(!showAuthKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showAuthKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`flex items-center gap-2 p-3 rounded ${
                  validationStatus === 'success' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                  validationStatus === 'error' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                  'bg-blue-500 bg-opacity-20 text-blue-400'
                }`}>
                  {validationStatus === 'success' && <CheckCircle className="w-5 h-5" />}
                  {validationStatus === 'error' && <XCircle className="w-5 h-5" />}
                  <span className="text-sm">{message}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isValidating}
                  className="cyber-button flex items-center gap-2 flex-1"
                >
                  <Save className="w-4 h-4" />
                  {isValidating ? 'Validating...' : 'Save Credentials'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isValidating}
                  className="cyber-button-secondary"
                >
                  Clear
                </button>
              </div>

              <div className="pt-4 border-t border-cyber-border">
                <p className="text-xs text-gray-400">
                  Your credentials are stored locally in your browser's localStorage and are never sent to any server except the official FTC API.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
