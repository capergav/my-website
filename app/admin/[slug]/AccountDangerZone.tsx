"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/app/lib/supabase";

export function AccountDangerZone() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete account');
        setLoading(false);
        return;
      }
      await supabase.auth.signOut();
      router.push('/?deleted=1');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-12 border border-red-200 rounded-2xl p-6 bg-red-50/50">
        <h2 className="text-base font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-sm text-red-600/80 mb-4">
          Permanently delete your DineLinks account, your menu, all uploaded photos, and cancel any active subscription. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => { setConfirmText(''); setError(''); setShowModal(true); }}
          className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-xl hover:bg-red-100 transition-colors"
        >
          Delete account
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Delete your account?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This permanently deletes your DineLinks account, your menu, all uploaded photos, and cancels any active subscription. This cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                autoComplete="off"
              />
            </div>
            {error && <p className="text-sm text-red-600 mb-3 text-center">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowModal(false); setConfirmText(''); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
