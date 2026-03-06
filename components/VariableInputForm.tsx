import React, { useState } from 'react';
import { Play, Loader2, Sparkles } from 'lucide-react';
import { generateContent } from '../services/geminiService';
import { useStore } from '../store';

interface VariableInputFormProps {
  promptTitle?: string;
  promptDescription?: string;
  variables: string[];
  onExecute: (values: Record<string, string>) => void;
  isExecuting: boolean;
}

export const VariableInputForm: React.FC<VariableInputFormProps> = ({ 
  promptTitle,
  promptDescription,
  variables, 
  onExecute, 
  isExecuting 
}) => {
  const { getDecryptedApiKey } = useStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isFilling, setIsFilling] = useState(false);

  const handleChange = (variable: string, value: string) => {
    setValues(prev => ({ ...prev, [variable]: value }));
  };

  const handleAutoFill = async () => {
    setIsFilling(true);
    try {
      const context = `
      Prompt Title: ${promptTitle || 'Unknown'}
      Description: ${promptDescription || 'None'}
      Variables: ${variables.join(', ')}
      `;
      
      const prompt = `${context}
      
      Based on the title and description above, please generate realistic, creative, and specific example values for the listed variables.
      
      IMPORTANT RESPONSE FORMAT:
      Return ONLY a raw JSON object. Do not include markdown formatting (like \`\`\`json).
      The keys must be the variable names exactly as listed.
      The values should be the generated example content strings.
      `;

      const apiKey = getDecryptedApiKey();
      const responseText = await generateContent(prompt, apiKey);
      // Remove potential markdown code blocks just in case
      const cleanJson = responseText.replace(/^```(json)?\n|```$/g, '').trim();
      
      const suggestions = JSON.parse(cleanJson);
      setValues(prev => ({ ...prev, ...suggestions }));
    } catch (error: any) {
      console.error("Auto-fill failed:", error);
      alert(`자동 채우기 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecute(values);
  };

  if (variables.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 mb-4">이 프롬프트에는 입력할 변수가 없습니다.</p>
        <button
          onClick={() => onExecute({})}
          disabled={isExecuting}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
          {isExecuting ? '생성 중...' : '바로 실행하기'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
            변수 입력
          </h3>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isFilling || isExecuting}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
            title="AI가 변수 내용을 자동으로 추천해줍니다"
          >
            {isFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isFilling ? '생성 중...' : 'AI 자동 채우기'}
          </button>
      </div>

      <div className="space-y-4 mb-6">
        {variables.map((variable) => (
          <div key={variable}>
            <label htmlFor={variable} className="block text-sm font-medium text-slate-700 mb-1.5">
              {variable}
            </label>
            {variable.toLowerCase().includes('code') || variable.toLowerCase().includes('content') ? (
               <textarea
                id={variable}
                required
                value={values[variable] || ''}
                onChange={(e) => handleChange(variable, e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px] placeholder-slate-400"
                placeholder={`${variable} 내용을 입력하세요...`}
              />
            ) : (
              <input
                type="text"
                id={variable}
                required
                value={values[variable] || ''}
                onChange={(e) => handleChange(variable, e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                placeholder={`${variable} 입력`}
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={isExecuting}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg transform active:scale-[0.99]"
      >
        {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
        {isExecuting ? 'AI 응답 생성 중...' : '프롬프트 실행'}
      </button>
    </form>
  );
};