import { CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onApprove?: () => void;
  onRemove?: () => void;
  onRestore?: () => void;
  onClear: () => void;
  showApprove?: boolean;
  showRemove?: boolean;
  showRestore?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onApprove,
  onRemove,
  onRestore,
  onClear,
  showApprove = true,
  showRemove = true,
  showRestore = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-2">
          {showApprove && onApprove && (
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          )}

          {showRemove && onRemove && (
            <button
              onClick={onRemove}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Remove
            </button>
          )}

          {showRestore && onRestore && (
            <button
              onClick={onRestore}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restore
            </button>
          )}

          <button
            onClick={onClear}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
