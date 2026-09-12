import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from './Button';
import Loading from './Loading';
import PackingItemModal from './PackingItemModal';
import DeletePackingItemModal from './DeletePackingItemModal';
import {
  getPackingItems,
  getPackingSummary,
  createPackingItem,
  updatePackingItem,
  togglePackedStatus,
  deletePackingItem,
} from '../services/packingService';
import {
  Luggage,
  CheckCircle2,
  Circle,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  RefreshCw,
  Shirt,
  Sparkles,
  Smartphone,
  FileText,
  HeartPulse,
  ShoppingBag,
  Package,
  Filter,
  CheckCheck,
  Check,
} from 'lucide-react';

// Category Configuration & Styling
const CATEGORY_MAP = {
  CLOTHING: {
    label: 'Clothing & Apparel',
    icon: Shirt,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  TOILETRIES: {
    label: 'Toiletries & Hygiene',
    icon: Sparkles,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  ELECTRONICS: {
    label: 'Electronics & Gadgets',
    icon: Smartphone,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  DOCUMENTS: {
    label: 'Documents & IDs',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  MEDICINE: {
    label: 'Medicine & Health',
    icon: HeartPulse,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  ACCESSORIES: {
    label: 'Accessories & Gear',
    icon: ShoppingBag,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  OTHER: {
    label: 'Other Essentials',
    icon: Package,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const PackingListSection = ({ tripId }) => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Category Filter ('ALL' or category key)
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Toggle Loading Map to prevent duplicate clicks while toggling
  const [togglingItemIds, setTogglingItemIds] = useState(new Set());

  // Add / Edit Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [itemModalError, setItemModalError] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch all packing items and summary
  const fetchData = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setError('');

    try {
      const [itemsRes, summaryRes] = await Promise.all([
        getPackingItems(tripId),
        getPackingSummary(tripId),
      ]);
      setItems(Array.isArray(itemsRes) ? itemsRes : []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load packing list:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to reach packing list service. Please check connection.');
      } else {
        setError('Failed to load trip packing list. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh summary after mutation
  const refreshSummary = async () => {
    try {
      const updatedSummary = await getPackingSummary(tripId);
      setSummary(updatedSummary);
    } catch (err) {
      console.warn('Failed to refresh summary:', err);
    }
  };

  // Toggle Packed Status Handler
  const handleTogglePacked = async (item) => {
    if (!item?.id || togglingItemIds.has(item.id)) return;

    // Optimistic UI state
    const newPackedState = !item.packed;
    setTogglingItemIds((prev) => new Set(prev).add(item.id));

    setItems((prevItems) =>
      prevItems.map((it) => (it.id === item.id ? { ...it, packed: newPackedState } : it))
    );

    try {
      const updatedItem = await togglePackedStatus(tripId, item.id);
      setItems((prevItems) =>
        prevItems.map((it) => (it.id === item.id ? updatedItem : it))
      );
      await refreshSummary();
    } catch (err) {
      console.error('Failed to toggle packed status:', err);
      // Revert optimistic update
      setItems((prevItems) =>
        prevItems.map((it) => (it.id === item.id ? { ...it, packed: !newPackedState } : it))
      );
    } finally {
      setTogglingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setItemModalError('');
    setIsItemModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemModalError('');
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    if (!isSubmittingItem) {
      setIsItemModalOpen(false);
      setEditingItem(null);
      setItemModalError('');
    }
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (payload) => {
    setIsSubmittingItem(true);
    setItemModalError('');

    try {
      if (editingItem?.id) {
        const updated = await updatePackingItem(tripId, editingItem.id, payload);
        setItems((prev) => prev.map((it) => (it.id === editingItem.id ? updated : it)));
      } else {
        const created = await createPackingItem(tripId, payload);
        setItems((prev) => [...prev, created]);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      await refreshSummary();
    } catch (err) {
      console.error('Failed to save packing item:', err);
      if (err.response?.status === 409) {
        setItemModalError('This item already exists in this category.');
      } else if (err.response?.data?.message) {
        setItemModalError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const first = Object.values(err.response.data.errors)[0];
        setItemModalError(first || 'Validation failed. Please check inputs.');
      } else {
        setItemModalError('Failed to save packing item. Please try again.');
      }
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeletingItem) {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setDeleteError('');
    }
  };

  // Confirm Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;

    setIsDeletingItem(true);
    setDeleteError('');

    try {
      await deletePackingItem(tripId, itemToDelete.id);
      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      await refreshSummary();
    } catch (err) {
      console.error('Failed to delete packing item:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete packing item.');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Derived Summary Metrics from backend summary (Source of Truth)
  const totalItems = summary?.totalItems ?? items.length;
  const packedItems = summary?.packedItems ?? items.filter((i) => i.packed).length;
  const unpackedItems = summary?.unpackedItems ?? Math.max(0, totalItems - packedItems);
  const completionPercentage = summary?.completionPercentage ?? (totalItems > 0 ? (packedItems / totalItems) * 100 : 0);
  const isAllPacked = totalItems > 0 && packedItems === totalItems;

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return items;
    return items.filter((item) => (item.category || '').toUpperCase() === selectedCategory);
  }, [items, selectedCategory]);

  // Group filtered items by category for structured display
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const cat = (item.category || 'OTHER').toUpperCase();
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categoriesPresent = useMemo(() => {
    return Object.keys(groupedItems).sort();
  }, [groupedItems]);

  // Unique categories count in total list for filter pills
  const categoryCounts = useMemo(() => {
    const counts = { ALL: items.length };
    items.forEach((item) => {
      const cat = (item.category || 'OTHER').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Loading State
  if (isLoading) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shadow-xs">
            <Luggage className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Trip Packing List</h2>
            <p className="text-sm text-slate-500">Loading packing items and progress...</p>
          </div>
        </div>
        <div className="py-12 flex justify-center">
          <Loading />
        </div>
      </section>
    );
  }

  // Error State
  if (error) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3.5 mb-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl shadow-xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Trip Packing List</h2>
            <p className="text-sm text-slate-500">Pack everything you need before your journey</p>
          </div>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Unable to load packing list</h3>
          <p className="text-sm text-rose-600 max-w-md mx-auto mb-4">{error}</p>
          <Button
            onClick={fetchData}
            variant="outline"
            className="inline-flex items-center space-x-2 border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Packing List</span>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Trip Packing List"
      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shadow-xs">
            <Luggage className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Trip Packing List</h2>
              {isAllPacked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="h-3 w-3 mr-1" />
                  All Packed
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">Pack everything you need before your journey</p>
          </div>
        </div>

        {/* Add Item Button */}
        <Button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </Button>
      </div>

      {/* Summary / Progress Header Card */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 sm:p-6 border border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {/* Total Items */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{totalItems}</p>
          </div>

          {/* Packed Items */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Packed</span>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600">{packedItems}</p>
          </div>

          {/* Remaining Items */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Remaining</span>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600">{unpackedItems}</p>
          </div>

          {/* Completion Rate */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Completion</span>
            <p className="text-xl sm:text-2xl font-extrabold text-blue-600">{completionPercentage.toFixed(1)}%</p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5 pt-3 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center space-x-1.5">
              <span>Packing Progress:</span>
              <span className="font-bold text-slate-900">
                {packedItems} of {totalItems} packed
              </span>
            </span>
            <span className="font-bold text-slate-900">{completionPercentage.toFixed(0)}%</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllPacked
                  ? 'bg-emerald-500'
                  : completionPercentage > 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            />
          </div>

          {isAllPacked && (
            <p className="text-xs font-semibold text-emerald-700 flex items-center space-x-1 pt-1">
              <CheckCheck className="h-4 w-4" />
              <span>All packed and ready for the trip! 🎉</span>
            </p>
          )}
        </div>
      </div>

      {/* Category Filter Pills (When items exist) */}
      {items.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1 pr-1 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </span>

          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Items ({categoryCounts.ALL})
          </button>

          {Object.keys(CATEGORY_MAP).map((catKey) => {
            const count = categoryCounts[catKey] || 0;
            if (count === 0) return null;
            const config = CATEGORY_MAP[catKey];
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{config.label.split(' ')[0]}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="bg-slate-50/70 rounded-2xl p-10 sm:p-12 border border-slate-100 text-center">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Luggage className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No packing items yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Start building your packing list so you don't forget the essentials. Add clothes, toiletries, electronics, documents, and medicine.
          </p>
          <Button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 px-6 py-2.5 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Item</span>
          </Button>
        </div>
      )}

      {/* Items List Grouped by Category */}
      {items.length > 0 && categoriesPresent.length > 0 && (
        <div className="space-y-6">
          {categoriesPresent.map((catKey) => {
            const groupList = groupedItems[catKey] || [];
            const config = CATEGORY_MAP[catKey] || CATEGORY_MAP.OTHER;
            const Icon = config.icon;
            const groupPacked = groupList.filter((i) => i.packed).length;

            return (
              <div
                key={catKey}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80">
                  <div className="flex items-center space-x-2.5">
                    <span className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{config.label}</h3>
                  </div>

                  <span className="text-xs font-semibold text-slate-500">
                    {groupPacked} / {groupList.length} packed
                  </span>
                </div>

                {/* Items in Category */}
                <div className="divide-y divide-slate-100">
                  {groupList.map((item) => {
                    const isToggling = togglingItemIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-4.5 flex items-start justify-between gap-3 transition-colors ${
                          item.packed ? 'bg-slate-50/40 hover:bg-slate-50/80' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Checkbox & Details */}
                        <div className="flex items-start space-x-3.5 flex-grow truncate">
                          <button
                            type="button"
                            onClick={() => handleTogglePacked(item)}
                            disabled={isToggling}
                            aria-label={`Mark ${item.itemName} as ${item.packed ? 'unpacked' : 'packed'}`}
                            className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 focus:outline-none cursor-pointer disabled:opacity-50"
                          >
                            {item.packed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-400 hover:text-blue-600 transition-colors" />
                            )}
                          </button>

                          <div className="space-y-1 truncate flex-grow">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  item.packed
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {item.itemName}
                              </span>

                              {item.quantity > 1 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                                  x{item.quantity}
                                </span>
                              )}
                            </div>

                            {item.notes && (
                              <p
                                className={`text-xs ${
                                  item.packed ? 'text-slate-400' : 'text-slate-500'
                                } line-clamp-2`}
                              >
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Item"
                            aria-label={`Edit ${item.itemName}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Item"
                            aria-label={`Delete ${item.itemName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No matching items in filter */}
      {items.length > 0 && categoriesPresent.length === 0 && (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
          No items found in selected category.
        </div>
      )}

      {/* Create / Edit Modal */}
      <PackingItemModal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        onSubmit={handleSaveItem}
        initialData={editingItem}
        isLoading={isSubmittingItem}
        serverError={itemModalError}
      />

      {/* Delete Confirmation Modal */}
      <DeletePackingItemModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
        isLoading={isDeletingItem}
        error={deleteError}
      />
    </section>
  );
};

export default PackingListSection;
