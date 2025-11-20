import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface BulkCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (categoryIds: string[]) => void;
  selectedCount: number;
  loading?: boolean;
}

export function BulkCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  loading = false,
}: BulkCategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  }

  function handleConfirm() {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    onConfirm(selectedCategories);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl border border-border max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Tag className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Update Categories</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedCount} discussion{selectedCount !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground mb-4 text-sm">
          Select new categories to apply to all selected discussions. This will replace existing categories.
        </p>

        <div className="flex flex-wrap gap-2 mb-6 max-h-64 overflow-y-auto">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                  } else {
                    if (selectedCategories.length < 3) {
                      setSelectedCategories([...selectedCategories, category.id]);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'text-white border-2 border-transparent'
                    : 'bg-accent text-foreground border-2 border-border hover:bg-accent/70'
                }`}
                style={isSelected ? { backgroundColor: category.color } : {}}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {selectedCategories.length === 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            At least one category is required
          </p>
        )}

        {selectedCategories.length >= 3 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            Maximum 3 categories allowed
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/70 text-foreground font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedCategories.length === 0}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Categories'}
          </button>
        </div>
      </div>
    </div>
  );
}
