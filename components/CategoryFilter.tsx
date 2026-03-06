import React, { useState } from 'react';
import { Category } from '../types';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { Plus, X, Check } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory: Category;
  onSelect: (category: Category) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ activeCategory, onSelect }) => {
  const { categories, addCategory } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const displayCategories = ['All', ...categories];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
        addCategory(newCategoryName.trim());
        onSelect(newCategoryName.trim());
        setNewCategoryName('');
        setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      {displayCategories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={clsx(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
            activeCategory === cat
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
          )}
        >
          {cat === 'All' ? '전체' : cat}
        </button>
      ))}

      {isAdding ? (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-1 bg-white border border-blue-300 rounded-full pl-3 pr-1 py-1 shadow-sm">
            <input 
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="새 카테고리"
                autoFocus
                className="w-24 text-sm outline-none text-slate-700 placeholder-slate-400"
            />
            <button 
                type="submit"
                disabled={!newCategoryName.trim()}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-30"
            >
                <Check className="w-3.5 h-3.5" />
            </button>
            <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </form>
      ) : (
        <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors"
            title="새 카테고리 추가"
        >
            <Plus className="w-4 h-4" />
            <span className="text-xs">추가</span>
        </button>
      )}
    </div>
  );
};