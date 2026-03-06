import React from 'react';
import { PromptTemplate } from '../types';
import { Edit2, Play, Trash2, Code, FileText, Briefcase, User, Sparkles } from 'lucide-react';

interface PromptCardProps {
  prompt: PromptTemplate;
  onEdit: (id: string) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
}

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'Coding': return <Code className="w-5 h-5 text-indigo-500" />;
    case 'Writing': return <FileText className="w-5 h-5 text-emerald-500" />;
    case 'Business': return <Briefcase className="w-5 h-5 text-blue-500" />;
    case 'Personal': return <User className="w-5 h-5 text-orange-500" />;
    case 'Marketing': return <Sparkles className="w-5 h-5 text-purple-500" />;
    default: return <FileText className="w-5 h-5 text-slate-500" />;
  }
};

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onEdit, onRun, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
      onDelete(prompt.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full group">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-50 rounded-lg">
              {getIconForCategory(prompt.category)}
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
              {prompt.category}
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {prompt.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
          {prompt.description}
        </p>
      </div>
      
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                {prompt.variables.length} 변수
            </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(prompt.id)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="수정"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onRun(prompt.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            실행
          </button>
        </div>
      </div>
    </div>
  );
};
