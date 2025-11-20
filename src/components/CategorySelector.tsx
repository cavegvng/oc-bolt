import { Check, Vote, Users, Scale, Palette, TrendingUp, Leaf, LucideIcon } from 'lucide-react';
import { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategorySelectorProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (categoryIds: string[]) => void;
  maxSelection?: number;
}

const categoryColors: Record<string, { bg: string; hover: string; selected: string; text: string }> = {
  'Political': {
    bg: 'bg-red-100 dark:bg-red-900/20',
    hover: 'hover:bg-red-200 dark:hover:bg-red-900/40',
    selected: 'bg-red-600 dark:bg-red-600',
    text: 'text-red-900 dark:text-red-100',
  },
  'Social': {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/40',
    selected: 'bg-blue-600 dark:bg-blue-600',
    text: 'text-blue-900 dark:text-blue-100',
  },
  'Legal': {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/40',
    selected: 'bg-purple-600 dark:bg-purple-600',
    text: 'text-purple-900 dark:text-purple-100',
  },
  'Cultural': {
    bg: 'bg-pink-100 dark:bg-pink-900/20',
    hover: 'hover:bg-pink-200 dark:hover:bg-pink-900/40',
    selected: 'bg-pink-600 dark:bg-pink-600',
    text: 'text-pink-900 dark:text-pink-100',
  },
  'Economic': {
    bg: 'bg-green-100 dark:bg-green-900/20',
    hover: 'hover:bg-green-200 dark:hover:bg-green-900/40',
    selected: 'bg-green-600 dark:bg-green-600',
    text: 'text-green-900 dark:text-green-100',
  },
  'Environmental': {
    bg: 'bg-teal-100 dark:bg-teal-900/20',
    hover: 'hover:bg-teal-200 dark:hover:bg-teal-900/40',
    selected: 'bg-teal-600 dark:bg-teal-600',
    text: 'text-teal-900 dark:text-teal-100',
  },
};

const categoryIcons: Record<string, LucideIcon> = {
  'Vote': Vote,
  'Users': Users,
  'Scale': Scale,
  'Palette': Palette,
  'TrendingUp': TrendingUp,
  'Leaf': Leaf,
};

export function CategorySelector({ categories, selectedIds, onChange, maxSelection = 3 }: CategorySelectorProps) {
  const handleToggle = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter(id => id !== categoryId));
    } else if (selectedIds.length < maxSelection) {
      onChange([...selectedIds, categoryId]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id);
        const isDisabled = !isSelected && selectedIds.length >= maxSelection;
        const colors = categoryColors[category.name] || categoryColors['Political'];
        const IconComponent = categoryIcons[category.icon];

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleToggle(category.id)}
            disabled={isDisabled}
            className={`
              relative px-4 py-3 rounded-2xl font-medium transition-all duration-200
              ${isSelected
                ? `${colors.selected} text-white shadow-lg scale-105`
                : `${colors.bg} ${colors.text} ${!isDisabled && colors.hover}`
              }
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center justify-center gap-2 border-2
              ${isSelected ? 'border-transparent' : 'border-transparent hover:border-current/20'}
            `}
          >
            {IconComponent && <IconComponent className="w-5 h-5" />}
            <span className="text-sm">{category.name}</span>
            {isSelected && (
              <Check className="w-4 h-4 absolute top-2 right-2" />
            )}
          </button>
        );
      })}
    </div>
  );
}
