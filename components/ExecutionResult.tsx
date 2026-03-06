import React, { useState } from 'react';
import { Copy, Check, RefreshCw, AlertCircle, Download, FileJson } from 'lucide-react';
import { ExecutionResult as ExecutionResultType } from '../types';
import { saveToFile } from '../services/fileService';

interface ExecutionResultProps {
  result: ExecutionResultType | null;
  error: string | null;
  onRetry: () => void;
}

export const ExecutionResult: React.FC<ExecutionResultProps> = ({ result, error, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!result?.text) return;
    
    setIsSaving(true);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `AI_Result_${dateStr}.md`;
    
    await saveToFile(result.text, filename, 'text/markdown', 'Markdown File');
    setIsSaving(false);
  };

  if (error) {
    return (
      <div className="h-full p-6 bg-red-50 rounded-xl border border-red-200 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">오류 발생</h3>
        <p className="text-red-600 mb-6 max-w-sm">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full p-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✨</span>
        </div>
        <p className="text-center font-medium">왼쪽 폼에서 변수를 입력하고<br/>실행 버튼을 눌러주세요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          생성 결과
        </h3>
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">
                {new Date(result.timestamp).toLocaleTimeString()}
            </span>
            
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="파일로 저장"
            >
                <Download className="w-4 h-4" />
                {isSaving ? '저장 중...' : '저장'}
            </button>

            <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? '복사됨' : '복사'}
            </button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto bg-slate-50/30">
        <div className="prose prose-slate max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
          {result.text}
        </div>
      </div>
    </div>
  );
};