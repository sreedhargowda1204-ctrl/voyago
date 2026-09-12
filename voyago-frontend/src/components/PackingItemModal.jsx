import React, { useState } from 'react';
import Button from './Button';
import {
  X,
  Tag,
  Hash,
  FileText,
  AlertCircle,
  Loader2,
  CheckSquare,
  Package,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'CLOTHING', label: 'Clothing & Apparel' },
  { value: 'TOILETRIES', label: 'Toiletries & Hygiene' },
  { value: 'ELECTRONICS', label: 'Electronics & Gadgets' },
  { value: 'DOCUMENTS', label: 'Documents & IDs' },
  { value: 'MEDICINE', label: 'Medicine & Health' },
  { value: 'ACCESSORIES', label: 'Accessories & Gear' },
  { value: 'OTHER', label: 'Other Essentials' },
];

const PackingItemModal = ({
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
      <PackingItemModalContent
        key={initialData?.id || 'new-packing-item'}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        isLoading={isLoading}
        serverError={serverError}
      />
    </div>
  );
};

const PackingItemModalContent = ({
  onClose,
  onSubmit,
  initialData,
  isLoading,
  serverError,
}) => {
  const [formData, setFormData] = useState(() => ({
    itemName: initialData?.itemName || '',
    category: initialData?.category || 'CLOTHING',
    quantity: initialData?.quantity ? String(initialData.quantity) : '1',
    packed: Boolean(initialData?.packed),
    notes: initialData?.notes || '',
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.itemName || !formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    } else if (formData.itemName.trim().length > 100) {
      newErrors.itemName = 'Item name cannot exceed 100 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    const qty = parseInt(formData.quantity, 10);
    if (!formData.quantity || isNaN(qty) || qty < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      itemName: formData.itemName.trim(),
      category: formData.category,
      quantity: parseInt(formData.quantity, 10),
      packed: formData.packed,
      notes: formData.notes ? formData.notes.trim() : null,
    };

    onSubmit(payload);
  };

  const isEditMode = Boolean(initialData?.id);

  return (
    <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isEditMode ? 'Edit Packing Item' : 'Add Packing Item'}
          </h3>
        </div>
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
        {/* Item Name */}
        <div>
          <label htmlFor="packing-item-name" className="block text-sm font-medium text-slate-700 mb-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="packing-item-name"
            name="itemName"
            maxLength={100}
            value={formData.itemName}
            onChange={handleChange}
            placeholder="e.g. Passport, Universal Adapter, Hiking Boots"
            disabled={isLoading}
            className={`block w-full px-3.5 py-2.5 bg-white border ${
              errors.itemName ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
            } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
          />
          {errors.itemName && <p className="mt-1 text-xs text-rose-600">{errors.itemName}</p>}
        </div>

        {/* Category & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="packing-category" className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="h-4 w-4" />
              </div>
              <select
                id="packing-category"
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
            <label htmlFor="packing-quantity" className="block text-sm font-medium text-slate-700 mb-1">
              Quantity <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="h-4 w-4" />
              </div>
              <input
                type="number"
                id="packing-quantity"
                name="quantity"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="1"
                disabled={isLoading}
                className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${
                  errors.quantity ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>}
          </div>
        </div>

        {/* Packed Status Checkbox */}
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="packing-packed"
            name="packed"
            checked={formData.packed}
            onChange={handleChange}
            disabled={isLoading}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="packing-packed" className="text-sm font-medium text-slate-700 flex items-center space-x-1.5 cursor-pointer">
            <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
            <span>Mark as already packed</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="packing-notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes / Reminders (Optional)
          </label>
          <div className="relative rounded-lg">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none text-slate-400">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              id="packing-notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Put in carry-on bag / Pack extra batteries"
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
            <span>{isEditMode ? 'Save Changes' : 'Add to List'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PackingItemModal;
