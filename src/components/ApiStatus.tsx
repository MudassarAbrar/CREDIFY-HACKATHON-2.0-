import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const ApiStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isOnline === null) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[1999] px-4 py-2 border text-sm flex items-center gap-2 ${
      isOnline 
        ? 'bg-green-500/10 border-green-500/30 text-green-500' 
        : 'bg-red-500/10 border-red-500/30 text-red-500'
    }`}>
      {isOnline ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>API Connected</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>API Offline - Check backend server</span>
        </>
      )}
    </div>
  );
};
