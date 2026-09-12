import React, { useState } from 'react';
import Button from './Button';
import {
  X,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'FLIGHT', label: 'Flight & Airfare' },
  { value: 'HOTEL', label: 'Hotel & Lodging' },
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRANSPORT', label: 'Transport & Transit' },
  { value: 'ACTIVITY', label: 'Activity & Sightseeing' },
  { value: 'SHOPPING', label: 'Shopping & Souvenirs' },
  { value: 'OTHER', label: 'Other Miscellaneous' },
];

const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'UPI',
  'Net Banking',
  'Other',
];

const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  currency = 'INR',
  isLoading = false,
  serverError = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <ExpenseModalContent
        key={initialData?.id || 'new-expense'}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        currency={currency}
        isLoading={isLoading}
        serverError={serverError}
      />
    </div>
  );
};

const ExpenseModalContent = ({
  onClose,
  onSubmit,
  initialData,
  currency,
  isLoading,
  serverError,
}) => {
  const [formData, setFormData] = useState(() => ({
    category: initialData?.category || 'FOOD',
    amount: initialData?.amount ? String(initialData.amount) : '',
    expenseDate: initialData?.expenseDate || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    paymentMethod: initialData?.paymentMethod || 'Credit Card',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Please select an expense category';
    }

    const amountNum = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter an amount greater than 0';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      expenseDate: formData.expenseDate,
      description: formData.description ? formData.description.trim() : null,
      paymentMethod: formData.paymentMethod ? formData.paymentMethod.trim() : null,
    };

    onSubmit(payload);
  };

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {isEditMode ? 'Edit Expense' : 'Record New Expense'}
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
        {/* Category & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expense-category" className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="h-4 w-4" />
              </div>
              <select
                id="expense-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.category ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-700 mb-1">
              Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <input
                type="number"
                id="expense-amount"
                name="amount"
                min="0.01"
                step="any"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.amount ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>}
          </div>
        </div>

        {/* Expense Date & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expense-date" className="block text-sm font-medium text-slate-700 mb-1">
              Expense Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                id="expense-date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.expenseDate ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.expenseDate && <p className="mt-1 text-xs text-rose-600">{errors.expenseDate}</p>}
          </div>

          <div>
            <label htmlFor="expense-payment-method" className="block text-sm font-medium text-slate-700 mb-1">
              Payment Method
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <input
                type="text"
                list="payment-methods-list"
                id="expense-payment-method"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                placeholder="e.g. Credit Card, UPI, Cash"
                disabled={isLoading}
                className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 focus:ring-blue-500 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2"
              />
              <datalist id="payment-methods-list">
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="expense-description" className="block text-sm font-medium text-slate-700 mb-1">
            Description / Notes
          </label>
          <div className="relative rounded-lg">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none text-slate-400">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              id="expense-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Flight tickets via AirFrance / Dinner at rooftop restaurant"
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 focus:ring-blue-500 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Actions */}
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
            <span>{isEditMode ? 'Save Changes' : 'Add Expense'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseModal;
