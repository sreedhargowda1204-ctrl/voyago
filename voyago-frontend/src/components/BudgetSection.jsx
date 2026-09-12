import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Loading from './Loading';
import BudgetModal from './BudgetModal';
import DeleteBudgetModal from './DeleteBudgetModal';
import ExpenseModal from './ExpenseModal';
import DeleteExpenseModal from './DeleteExpenseModal';
import ExpenseList from './ExpenseList';
import {
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
} from '../services/budgetService';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService';
import {
  Wallet,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const formatCurrency = (amount, currency = 'INR') => {
  if (typeof amount !== 'number' || isNaN(amount)) return `0.00 ${currency}`;
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${absFormatted} ${currency}`;
};

const BudgetSection = ({ tripId }) => {
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Budget Modal State (Create / Edit)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);
  const [budgetModalError, setBudgetModalError] = useState('');

  // Delete Budget Modal State
  const [isDeleteBudgetOpen, setIsDeleteBudgetOpen] = useState(false);
  const [isDeletingBudget, setIsDeletingBudget] = useState(false);
  const [deleteBudgetError, setDeleteBudgetError] = useState('');

  // Expense Modal State (Create / Edit)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseModalError, setExpenseModalError] = useState('');

  // Delete Expense Modal State
  const [isDeleteExpenseOpen, setIsDeleteExpenseOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);
  const [deleteExpenseError, setDeleteExpenseError] = useState('');

  // Fetch all budget and expense data
  const fetchData = useCallback(async () => {
    if (!tripId) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Fetch budget (404 is normal if not set yet)
      let currentBudget = null;
      try {
        currentBudget = await getBudget(tripId);
      } catch (budgetErr) {
        if (budgetErr.response?.status !== 404) {
          console.warn('Budget lookup warning:', budgetErr);
        }
      }
      setBudget(currentBudget);

      // 2. Fetch budget summary (source of truth)
      let currentSummary = null;
      try {
        currentSummary = await getBudgetSummary(tripId);
      } catch (sumErr) {
        console.warn('Summary lookup warning:', sumErr);
      }
      setSummary(currentSummary);

      // 3. Fetch expenses list
      const expensesList = await getExpenses(tripId);
      setExpenses(Array.isArray(expensesList) ? expensesList : []);
    } catch (err) {
      console.error('Failed to load budget section:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to reach backend service. Please check connection.');
      } else {
        setError('Failed to load trip budget information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh summary and expenses without full reload
  const refreshExpensesAndSummary = async () => {
    try {
      const [newSummary, newExpenses] = await Promise.all([
        getBudgetSummary(tripId),
        getExpenses(tripId),
      ]);
      setSummary(newSummary);
      setExpenses(Array.isArray(newExpenses) ? newExpenses : []);
    } catch (err) {
      console.warn('Silent refresh error:', err);
    }
  };

  // Refresh budget and summary after budget mutations
  const refreshBudgetAndSummary = async () => {
    try {
      let newBudget = null;
      try {
        newBudget = await getBudget(tripId);
      } catch (bErr) {
        if (bErr.response?.status !== 404) console.warn(bErr);
      }
      const newSummary = await getBudgetSummary(tripId);
      setBudget(newBudget);
      setSummary(newSummary);
    } catch (err) {
      console.warn('Silent budget refresh error:', err);
    }
  };

  // --- Budget Handlers ---
  const handleOpenBudgetModal = () => {
    setBudgetModalError('');
    setIsBudgetModalOpen(true);
  };

  const handleCloseBudgetModal = () => {
    if (!isSubmittingBudget) {
      setIsBudgetModalOpen(false);
      setBudgetModalError('');
    }
  };

  const handleSaveBudget = async (payload) => {
    setIsSubmittingBudget(true);
    setBudgetModalError('');

    try {
      if (budget?.id) {
        await updateBudget(tripId, payload);
      } else {
        await createBudget(tripId, payload);
      }
      setIsBudgetModalOpen(false);
      await refreshBudgetAndSummary();
    } catch (err) {
      console.error('Failed to save budget:', err);
      if (err.response?.data?.message) {
        setBudgetModalError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const first = Object.values(err.response.data.errors)[0];
        setBudgetModalError(first || 'Validation failed');
      } else {
        setBudgetModalError('Failed to save budget. Please try again.');
      }
    } finally {
      setIsSubmittingBudget(false);
    }
  };

  const handleOpenDeleteBudget = () => {
    setDeleteBudgetError('');
    setIsDeleteBudgetOpen(true);
  };

  const handleCloseDeleteBudget = () => {
    if (!isDeletingBudget) {
      setIsDeleteBudgetOpen(false);
      setDeleteBudgetError('');
    }
  };

  const handleConfirmDeleteBudget = async () => {
    setIsDeletingBudget(true);
    setDeleteBudgetError('');

    try {
      await deleteBudget(tripId);
      setIsDeleteBudgetOpen(false);
      setBudget(null);
      await refreshBudgetAndSummary();
    } catch (err) {
      console.error('Failed to delete budget:', err);
      setDeleteBudgetError(err.response?.data?.message || 'Failed to delete budget.');
    } finally {
      setIsDeletingBudget(false);
    }
  };

  // --- Expense Handlers ---
  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setExpenseModalError('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseModalError('');
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    if (!isSubmittingExpense) {
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      setExpenseModalError('');
    }
  };

  const handleSaveExpense = async (payload) => {
    setIsSubmittingExpense(true);
    setExpenseModalError('');

    try {
      if (editingExpense?.id) {
        await updateExpense(tripId, editingExpense.id, payload);
      } else {
        await createExpense(tripId, payload);
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      await refreshExpensesAndSummary();
    } catch (err) {
      console.error('Failed to save expense:', err);
      if (err.response?.data?.message) {
        setExpenseModalError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const first = Object.values(err.response.data.errors)[0];
        setExpenseModalError(first || 'Validation failed');
      } else {
        setExpenseModalError('Failed to save expense. Please try again.');
      }
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleOpenDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteExpenseError('');
    setIsDeleteExpenseOpen(true);
  };

  const handleCloseDeleteExpense = () => {
    if (!isDeletingExpense) {
      setIsDeleteExpenseOpen(false);
      setExpenseToDelete(null);
      setDeleteExpenseError('');
    }
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete?.id) return;

    setIsDeletingExpense(true);
    setDeleteExpenseError('');

    try {
      await deleteExpense(tripId, expenseToDelete.id);
      setIsDeleteExpenseOpen(false);
      setExpenseToDelete(null);
      await refreshExpensesAndSummary();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setDeleteExpenseError(err.response?.data?.message || 'Failed to delete expense.');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Active currency display
  const activeCurrency = budget?.currency || summary?.currency || 'INR';

  // Metrics derived from summary (source of truth)
  const totalBudget = summary?.totalBudget || 0;
  const totalSpent = summary?.totalSpent || 0;
  const remainingBudget = summary?.remainingBudget ?? (totalBudget - totalSpent);
  const expenseCount = summary?.expenseCount ?? expenses.length;
  const isOverBudget = remainingBudget < 0;

  // Progress Bar Percentage calculation
  const progressPercent = totalBudget > 0
    ? Math.min(100, Math.max(0, (totalSpent / totalBudget) * 100))
    : 0;

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="h-6 w-6 animate-pulse text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Trip Budget & Expenses</h2>
            <p className="text-sm text-slate-500">Loading budget records and expenses...</p>
          </div>
        </div>
        <div className="py-12 flex justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Trip Budget & Expenses</h2>
            <p className="text-sm text-slate-500">Manage trip finances and expenses</p>
          </div>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-rose-900 mb-1">Unable to load budget information</h3>
          <p className="text-sm text-rose-600 max-w-md mx-auto mb-4">{error}</p>
          <Button
            onClick={fetchData}
            variant="outline"
            className="inline-flex items-center space-x-2 border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Budget</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-xs">
            <Wallet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Trip Budget & Expenses</h2>
              {budget ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {budget.currency} Budget Set
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  No Budget Set
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">Track total allowance, categorize expenses, and monitor trip spending</p>
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center space-x-2">
          {budget ? (
            <>
              <Button
                onClick={handleOpenBudgetModal}
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1.5 flex items-center space-x-1.5 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Budget</span>
              </Button>
              <Button
                onClick={handleOpenDeleteBudget}
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1.5 flex items-center space-x-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Budget</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={handleOpenBudgetModal}
              size="sm"
              className="text-xs px-4 py-2 flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Set Budget</span>
            </Button>
          )}

          <Button
            onClick={handleOpenCreateExpense}
            size="sm"
            variant={budget ? 'primary' : 'outline'}
            className="text-xs px-4 py-2 flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Over-Budget Alert Banner */}
      {isOverBudget && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold">Trip is currently over budget!</p>
              <p className="text-xs text-rose-600">
                You have spent {formatCurrency(Math.abs(remainingBudget), activeCurrency)} more than the planned budget of {formatCurrency(totalBudget, activeCurrency)}.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800 self-start sm:self-auto">
            Deficit: {formatCurrency(remainingBudget, activeCurrency)}
          </span>
        </div>
      )}

      {/* Summary Cards Grid (4 Columns on lg/xl, 2 on md, 1 on sm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Budget Card */}
        <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Allocated Budget</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono truncate">
              {budget ? formatCurrency(totalBudget, activeCurrency) : 'Not Set'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {budget ? 'Target travel allowance' : 'Click "Set Budget" to allocate'}
            </p>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono truncate">
              {formatCurrency(totalSpent, activeCurrency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {expenseCount} recorded expenses</p>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div
          className={`rounded-2xl p-4.5 border flex flex-col justify-between ${
            isOverBudget
              ? 'bg-rose-50/60 border-rose-200'
              : 'bg-slate-50/80 border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining Balance</span>
            <div
              className={`p-2 rounded-xl ${
                isOverBudget ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isOverBudget ? <AlertCircle className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-extrabold font-mono truncate ${
                isOverBudget ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {formatCurrency(remainingBudget, activeCurrency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isOverBudget ? 'Exceeded planned budget' : 'Available to spend'}
            </p>
          </div>
        </div>

        {/* Expense Count Card */}
        <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
              {expenseCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Categorized expense items</p>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visible when budget is set) */}
      {budget && totalBudget > 0 && (
        <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-100 mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span>Budget Utilization:</span>
              <span className="font-bold text-slate-900">
                {((totalSpent / totalBudget) * 100).toFixed(1)}%
              </span>
            </div>
            <span>
              {formatCurrency(totalSpent, activeCurrency)} of {formatCurrency(totalBudget, activeCurrency)}
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : progressPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Expenses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Recorded Expenses</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {expenses.length}
            </span>
          </div>

          <Button
            onClick={handleOpenCreateExpense}
            variant="outline"
            size="sm"
            className="text-xs px-3 py-1.5 flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </Button>
        </div>

        <ExpenseList
          expenses={expenses}
          currency={activeCurrency}
          onEdit={handleOpenEditExpense}
          onDelete={handleOpenDeleteExpense}
          onAddExpense={handleOpenCreateExpense}
        />
      </div>

      {/* Modals */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={handleCloseBudgetModal}
        onSubmit={handleSaveBudget}
        initialData={budget}
        isLoading={isSubmittingBudget}
        serverError={budgetModalError}
      />

      <DeleteBudgetModal
        isOpen={isDeleteBudgetOpen}
        onClose={handleCloseDeleteBudget}
        onConfirm={handleConfirmDeleteBudget}
        isLoading={isDeletingBudget}
        error={deleteBudgetError}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        onSubmit={handleSaveExpense}
        initialData={editingExpense}
        currency={activeCurrency}
        isLoading={isSubmittingExpense}
        serverError={expenseModalError}
      />

      <DeleteExpenseModal
        isOpen={isDeleteExpenseOpen}
        onClose={handleCloseDeleteExpense}
        onConfirm={handleConfirmDeleteExpense}
        expense={expenseToDelete}
        currency={activeCurrency}
        isLoading={isDeletingExpense}
        error={deleteExpenseError}
      />
    </section>
  );
};

export default BudgetSection;
