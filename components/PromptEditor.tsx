import React, { useState, useEffect } from 'react';
import { Category, PromptTemplate } from '../types';
import { useStore } from '../store';
import { Save, X, Info, Sparkles, Loader2 } from 'lucide-react';
import { generateContent } from '../services/geminiService';

interface PromptEditorProps {
  initialData?: PromptTemplate;
  onSave: (data: Omit<PromptTemplate, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ initialData, onSave, onCancel }) => {
  const { categories, getDecryptedApiKey } = useStore();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  // Default to first category if available, otherwise Writing, otherwise empty string
  const [category, setCategory] = useState<Category>(
    (initialData?.category as Category) || categories[0] || 'Writing'
  );
  const [variables, setVariables] = useState<string[]>([]);
  
  // State to track which field is currently generating a suggestion
  const [suggestingField, setSuggestingField] = useState<'title' | 'description' | 'content' | null>(null);

  useEffect(() => {
    // Auto-detect variables in {{variable}} format
    const regex = /{{\s*([^}]+)\s*}}/g;
    const found = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      found.push(match[1].trim());
    }
    // Unique variables
    setVariables([...new Set(found)]);
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      content,
      category,
      variables,
    });
  };

  const handleSuggest = async (field: 'title' | 'description' | 'content') => {
    // Check if there is enough context
    const hasContext = title.trim() || description.trim() || content.trim();
    if (!hasContext) {
      alert('AI 제안을 사용하려면 적어도 하나의 항목(제목, 설명, 또는 내용)을 먼저 입력해주세요.');
      return;
    }

    setSuggestingField(field);

    const context = `
    현재 작성 중인 프롬프트 정보:
    - 제목: ${title}
    - 설명: ${description}
    - 내용: ${content}
    - 카테고리: ${category}
    `;

    let prompt = '';
    if (field === 'title') {
      prompt = `${context}\n\n위 정보를 바탕으로 이 프롬프트 템플릿에 어울리는 짧고 직관적인 '제목'을 1개만 추천해줘. 따옴표나 부가 설명 없이 제목 텍스트만 출력해.`;
    } else if (field === 'description') {
      prompt = `${context}\n\n위 정보를 바탕으로 이 프롬프트 템플릿을 설명하는 한 문장의 '설명'을 작성해줘. 부가 설명 없이 텍스트만 출력해.`;
    } else if (field === 'content') {
      prompt = `${context}\n\n위 제목과 설명을 바탕으로 실제 AI에게 명령할 구체적인 '프롬프트 템플릿 본문'을 작성해줘. 사용자가 입력해야 하는 부분은 {{변수명}} 형식(예: {{topic}})으로 작성해줘. 마크다운 코드 블록 없이 순수 텍스트로만 출력해.`;
    }

    try {
      const apiKey = getDecryptedApiKey();
      const generatedText = await generateContent(prompt, apiKey);
      // Clean up potential markdown code blocks if the model adds them despite instructions
      const cleanText = generatedText.replace(/^```(markdown|text)?\n|```$/g, '').trim();

      if (field === 'title') setTitle(cleanText);
      else if (field === 'description') setDescription(cleanText);
      else if (field === 'content') setContent(cleanText);
    } catch (error: any) {
      console.error("Suggestion Error:", error);
      alert(`제안을 생성하는 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSuggestingField(null);
    }
  };

  const renderSuggestButton = (field: 'title' | 'description' | 'content') => (
    <button
      type="button"
      onClick={() => handleSuggest(field)}
      disabled={suggestingField !== null}
      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
      title="다른 항목의 내용을 바탕으로 자동 생성합니다"
    >
      {suggestingField === field ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      <span>{suggestingField === field ? '생성 중...' : 'AI 제안'}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">
                {initialData ? '프롬프트 수정' : '새 프롬프트 만들기'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">제목</label>
                    {renderSuggestButton('title')}
                </div>
                <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                placeholder="예: 이메일 생성기"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                >
                {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
                </select>
            </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
             <label className="block text-sm font-medium text-slate-700">설명</label>
             {renderSuggestButton('description')}
          </div>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
            placeholder="이 프롬프트에 대한 간단한 설명을 입력하세요"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-1">
             <label className="block text-sm font-medium text-slate-700">프롬프트 템플릿</label>
             <div className="flex items-center gap-3">
                 {renderSuggestButton('content')}
                 <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    <Info className="w-3 h-3" />
                    <span>{'{{변수명}}을 사용하세요'}</span>
                 </div>
             </div>
          </div>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full px-4 py-3 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm leading-relaxed resize-none placeholder-slate-400"
            placeholder="예: 당신은 {{role}}입니다. {{task}}에 대한 글을 작성해주세요."
          />
        </div>

        {variables.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-700 block mb-2">감지된 변수:</span>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <span key={v} className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-blue-600 shadow-sm">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </form>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          저장하기
        </button>
      </div>
    </div>
  );
};