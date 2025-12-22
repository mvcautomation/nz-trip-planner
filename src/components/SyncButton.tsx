'use client';

import { useState, useEffect } from 'react';
import { fullSync, getLastSync, pushToServer } from '@/lib/storage';

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Auto-sync on mount
    handleSync(true);
  }, []);

  const handleSync = async (silent = false) => {
    if (syncing) return;

    setSyncing(true);
    if (!silent) setStatus('idle');

    try {
      const success = await fullSync();
      if (!silent) {
        setStatus(success ? 'success' : 'error');
      }

      // Update last sync time
      const syncTime = await getLastSync();
      if (syncTime) {
        setLastSync(formatLastSync(syncTime));
      }
    } catch {
      if (!silent) setStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const handlePush = async () => {
    if (syncing) return;

    setSyncing(true);
    setStatus('idle');

    try {
      const success = await pushToServer();
      setStatus(success ? 'success' : 'error');

      const syncTime = await getLastSync();
      if (syncTime) {
        setLastSync(formatLastSync(syncTime));
      }
    } catch {
      setStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSync(false)}
        disabled={syncing}
        className={`sync-btn ${syncing ? 'opacity-50' : ''}`}
        title="Sync data across devices"
      >
        <svg
          className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="hidden sm:inline">
          {syncing ? 'Syncing...' : 'Sync'}
        </span>
      </button>

      {status === 'success' && (
        <span className="text-green-400 text-xs">Synced!</span>
      )}
      {status === 'error' && (
        <span className="text-red-400 text-xs">Sync failed</span>
      )}
      {lastSync && status === 'idle' && (
        <span className="text-gray-500 text-xs hidden sm:inline">{lastSync}</span>
      )}
    </div>
  );
}

function formatLastSync(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
