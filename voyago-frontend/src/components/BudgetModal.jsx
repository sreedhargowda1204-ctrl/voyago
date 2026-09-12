import React, { useState } from 'react';
import Button from './Button';
import { X, DollarSign, Globe, AlertCircle, Loader2 } from 'lucide-react';

const BudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
  serverError = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <BudgetModalContent
        key={initialData?.id || 'new-budget'}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        isLoading={isLoading}
        serverError={serverError}
      />
    </div>
  );
};

const BudgetModalContent = ({
  onClose,
  onSubmit,
  initialData,
  isLoading,
  serverError,
}) => {
  const [formData, setFormData] = useState(() => ({
    totalBudget: initialData?.totalBudget ? String(initialData.totalBudget) : '',
    currency: initialData?.currency || 'INR',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    const budgetNum = parseFloat(formData.totalBudget);
    if (!formData.totalBudget || isNaN(budgetNum) || budgetNum <= 0) {
      newErrors.totalBudget = 'Please enter a valid total budget greater than 0';
    }

    const trimmedCurrency = formData.currency.trim().toUpperCase();
    if (!trimmedCurrency) {
      newErrors.currency = 'Currency code is required';
    } else if (!/^[A-Z]{3}$/.test(trimmedCurrency)) {
      newErrors.currency = 'Currency must be a 3-letter ISO code (e.g. INR, USD, EUR)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'currency' ? value.toUpperCase() : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      totalBudget: parseFloat(formData.totalBudget),
      currency: formData.currency.trim().toUpperCase(),
    };

    onSubmit(payload);
  };

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {isEditMode ? 'Edit Trip Budget' : 'Set Trip Budget'}
        </h3>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Total Budget */}
        <div>
          <label htmlFor="budget-amount" className="block text-sm font-medium text-slate-700 mb-1">
            Total Budget Amount <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <input
              type="number"
              id="budget-amount"
              name="totalBudget"
              min="0.01"
              step="any"
              value={formData.totalBudget}
              onChange={handleChange}
              placeholder="e.g. 50000"
              disabled={isLoading}
              className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                errors.totalBudget ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
              } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
            />
          </div>
          {errors.totalBudget && <p className="mt-1 text-xs text-rose-600">{errors.totalBudget}</p>}
        </div>

        {/* Currency Code */}
        <div>
          <label htmlFor="budget-currency" className="block text-sm font-medium text-slate-700 mb-1">
            Currency Code (3 Letters) <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="h-4 w-4" />
            </div>
            <input
              type="text"
              id="budget-currency"
              name="currency"
              maxLength={3}
              value={formData.currency}
              onChange={handleChange}
              placeholder="e.g. INR, USD, EUR"
              disabled={isLoading}
              className={`block w-full pl-10 pr-3 py-2.5 bg-white border uppercase ${
                errors.currency ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
              } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 font-mono`}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Standard 3-letter currency code (INR, USD, EUR, GBP, JPY, etc.)</p>
          {errors.currency && <p className="mt-1 text-xs text-rose-600">{errors.currency}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-5 cursor-pointer shadow-sm"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditMode ? 'Save Changes' : 'Set Budget'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BudgetModal;
