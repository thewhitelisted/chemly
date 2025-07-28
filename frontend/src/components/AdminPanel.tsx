import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { apiConfig } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlanOption {
  value: string;
  label: string;
  credits: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  { value: 'free', label: 'Free', credits: '200 basic + 35 premium credits' },
  { value: 'pro', label: 'Pro', credits: '1000 basic + 750 premium credits' },
  { value: 'premium', label: 'Premium', credits: '2000 basic + 1500 premium credits' }
];

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { token } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [resetCredits, setResetCredits] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a user email' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiConfig.baseUrl}/admin/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_email: userEmail.trim(),
          new_plan: selectedPlan,
          reset_credits: resetCredits
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setUserEmail('');
        setSelectedPlan('free');
        setResetCredits(false);
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to update subscription' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#007d40]" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007d40] focus:border-transparent dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007d40] focus:border-transparent dark:bg-zinc-800 dark:text-white"
              >
                {PLAN_OPTIONS.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label} - {plan.credits}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="resetCredits"
                checked={resetCredits}
                onChange={(e) => setResetCredits(e.target.checked)}
                className="rounded border-gray-300 text-[#007d40] focus:ring-[#007d40]"
              />
              <label htmlFor="resetCredits" className="text-sm text-gray-700 dark:text-gray-300">
                Reset credit usage to 0
              </label>
            </div>

            {message && (
              <div className={`p-3 rounded-md flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {message.text}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#007d40] rounded-md hover:bg-[#006030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Update Plan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 