import React from 'react';
import Button from './Button';
import {
  Plane,
  Building2,
  Utensils,
  Car,
  Compass,
  ShoppingBag,
  Receipt,
  Edit3,
  Trash2,
  Calendar,
  CreditCard,
  Plus,
} from 'lucide-react';

const getCategoryMeta = (category) => {
  const cat = (category || 'OTHER').toUpperCase();
  switch (cat) {
    case 'FLIGHT':
      return {
        label: 'Flight',
        icon: Plane,
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
      };
    case 'HOTEL':
      return {
        label: 'Hotel',
        icon: Building2,
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'FOOD':
      return {
        label: 'Food & Dining',
        icon: Utensils,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'TRANSPORT':
      return {
        label: 'Transport',
        icon: Car,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'ACTIVITY':
      return {
        label: 'Activity',
        icon: Compass,
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'SHOPPING':
      return {
        label: 'Shopping',
        icon: ShoppingBag,
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    default:
      return {
        label: 'Other',
        icon: Receipt,
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
      };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
};

const formatAmount = (amount, currency = 'INR') => {
  if (typeof amount !== 'number') return `${amount} ${currency}`;
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const ExpenseList = ({
  expenses = [],
  currency = 'INR',
  onEdit,
  onDelete,
  onAddExpense,
}) => {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 text-center">
        <div className="h-14 w-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Receipt className="h-7 w-7" />
        </div>
        <h4 className="text-base font-bold text-slate-900 mb-1">No expenses recorded yet</h4>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">
          Keep track of your travel spending on hotels, flights, dining, and activities.
        </p>
        <Button
          onClick={onAddExpense}
          variant="outline"
          size="sm"
          className="inline-flex items-center space-x-1.5 cursor-pointer text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add First Expense</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const meta = getCategoryMeta(expense.category);
        const IconComponent = meta.icon;

        return (
          <div
            key={expense.id}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 hover:border-slate-200/80 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            {/* Left: Category Icon & Details */}
            <div className="flex items-start space-x-3.5 flex-grow min-w-0">
              <div
                className={`p-2.5 rounded-xl ${meta.bg} ${meta.text} border ${meta.border} shrink-0 mt-0.5 sm:mt-0`}
              >
                <IconComponent className="h-5 w-5" />
              </div>

              <div className="space-y-1 min-w-0 flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${meta.bg} ${meta.text}`}
                  >
                    {meta.label}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(expense.expenseDate)}</span>
                  </div>
                  {expense.paymentMethod && (
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <CreditCard className="h-3 w-3" />
                      <span>{expense.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {expense.description && (
                  <p className="text-xs text-slate-600 leading-relaxed truncate" title={expense.description}>
                    {expense.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Amount & Actions */}
            <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {formatAmount(expense.amount, currency)}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Edit Expense"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(expense)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete Expense"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseList;
