'use client';

import { useState, useCallback } from 'react';
import Toast from './Toast';

interface PaymentModalProps {
  playerName: string;
  amountOwed: number;
  bankDetails: {
    accountName: string;
    bsb: string;
    accountNumber: string;
  };
  onClose: () => void;
}

export default function PaymentModal({ playerName, amountOwed, bankDetails, onClose }: PaymentModalProps) {
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} copied!`);
      setShowToast(true);
    } catch {
      setToast('Failed to copy');
      setShowToast(true);
    }
  }, []);

  const formattedBsb = `${bankDetails.bsb.slice(0, 3)}-${bankDetails.bsb.slice(3)}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Details</h2>
        <p className="text-sm text-gray-500 mb-4">
          Amount owing: <span className="font-bold text-emerald-700">${amountOwed.toFixed(2)}</span>
        </p>

        <div className="space-y-3">
          <CopyRow label="Account Name" value={bankDetails.accountName} onCopy={copyToClipboard} />
          <CopyRow label="BSB" value={formattedBsb} copyValue={bankDetails.bsb} onCopy={copyToClipboard} />
          <CopyRow label="Account Number" value={bankDetails.accountNumber} onCopy={copyToClipboard} />
          <CopyRow label="Reference" value={playerName} onCopy={copyToClipboard} />
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Please use your name as the payment reference
        </p>
      </div>
      <Toast message={toast} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyValue,
  onCopy,
}: {
  label: string;
  value: string;
  copyValue?: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-mono font-semibold text-gray-900">{value}</div>
      </div>
      <button
        onClick={() => onCopy(copyValue ?? value, label)}
        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
      >
        Copy
      </button>
    </div>
  );
}
