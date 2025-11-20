import { Info } from 'lucide-react';
import { useState } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  children: React.ReactNode;
  error?: string;
}

export function FormField({ label, required, tooltip, children, error }: FormFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-foreground">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute left-6 top-0 z-10 w-64 p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-2xl shadow-xl">
                {tooltip}
                <div className="absolute left-0 top-2 -ml-1 w-2 h-2 bg-blue-600 transform rotate-45" />
              </div>
            )}
          </div>
        )}
      </div>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
