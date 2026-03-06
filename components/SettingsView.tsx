import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Save, CheckCircle, XCircle, Loader2, Folder, Key, ShieldCheck, FolderOpen } from 'lucide-react';
import { testConnection } from '../services/geminiService';

interface SettingsViewProps {
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose, isInitialSetup = false }) => {
  const { settings, setApiKey, setLocalPath, getDecryptedApiKey } = useStore();
  
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [pathInput, setPathInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  // 입력창 포커스를 위한 Ref
  const pathInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load existing settings
    setApiKeyInput(getDecryptedApiKey());
    setPathInput(settings.localPath || '');
  }, []);

  const handleTestConnection = async () => {
    if (!apiKeyInput) {
        setTestStatus('error');
        setTestMessage('API Key를 입력해주세요.');
        return;
    }

    setIsTesting(true);
    setTestMessage('Gemini API 연결 확인 중...');
    
    try {
        const success = await testConnection(apiKeyInput);
        if (success) {
            setTestStatus('success');
            setTestMessage('연결 성공! 유효한 API Key입니다.');
        } else {
            setTestStatus('error');
            setTestMessage('연결 실패. API Key를 확인해주세요.');
        }
    } catch (e) {
        setTestStatus('error');
        setTestMessage('연결 중 오류가 발생했습니다.');
    } finally {
        setIsTesting(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
        // @ts-ignore - File System Access API Check
        if (typeof window.showDirectoryPicker !== 'function') {
            throw new Error("API_NOT_SUPPORTED");
        }

        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle) {
            setPathInput(dirHandle.name);
        }
    } catch (error: any) {
        // 사용자가 취소한 경우는 무시
        if (error.name === 'AbortError') return;

        // 그 외 오류 (iframe 보안 제한, 브라우저 미지원 등) 발생 시 수동 입력 유도
        console.warn('Folder selection failed:', error);
        
        // 입력창으로 즉시 포커스 이동
        pathInputRef.current?.focus();
        
        alert(
            "현재 브라우저 보안 환경에서는 폴더 선택창을 직접 열 수 없습니다.\n" +
            "입력창에 원하시는 폴더 이름을 직접 입력해주세요."
        );
    }
  };

  const handleSave = () => {
    if (!apiKeyInput.trim()) {
        alert('API Key는 필수입니다.');
        return;
    }
    if (!pathInput.trim()) {
        alert('저장 경로(폴더명)를 지정해주세요.');
        pathInputRef.current?.focus();
        return;
    }

    setApiKey(apiKeyInput);
    setLocalPath(pathInput);

    if (onClose) onClose();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
                환경 설정
            </h2>
            <p className="text-slate-400 mt-1">
                {isInitialSetup 
                    ? "앱을 사용하기 위해 기본 설정을 완료해주세요." 
                    : "API Key 및 저장소 설정을 관리합니다."}
            </p>
        </div>

        <div className="p-8 space-y-8">
            {/* API Key Section */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    Gemini API Key
                </label>
                <div className="space-y-3">
                    <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => {
                            setApiKeyInput(e.target.value);
                            setTestStatus('idle');
                        }}
                        placeholder="AI Studio에서 발급받은 API Key 입력"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                    />
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            {isTesting && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                            {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                            <span className={
                                testStatus === 'success' ? 'text-green-600' : 
                                testStatus === 'error' ? 'text-red-600' : 'text-slate-500'
                            }>
                                {testMessage || 'API Key 유효성 검사가 필요합니다.'}
                            </span>
                        </div>
                        <button
                            onClick={handleTestConnection}
                            disabled={isTesting || !apiKeyInput}
                            className="text-sm px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            연결 테스트
                        </button>
                    </div>
                    <p className="text-xs text-slate-400">
                        * API Key는 사용자 브라우저(Local Storage)에 암호화되어 안전하게 저장됩니다.
                    </p>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Local Folder Section */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-600" />
                    로컬 저장소 경로 (Workspace)
                </label>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                             <input
                                ref={pathInputRef}
                                type="text"
                                value={pathInput}
                                onChange={(e) => setPathInput(e.target.value)}
                                placeholder="폴더 이름을 직접 입력하거나 버튼으로 선택하세요"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                            <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>
                        <button
                            onClick={handleSelectFolder}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <FolderOpen className="w-4 h-4" />
                            폴더 선택
                        </button>
                    </div>
                    
                    <p className="text-xs text-slate-500">
                        * 보안 정책으로 인해 폴더 선택이 안될 경우 직접 이름을 입력해주세요.
                    </p>
                </div>
            </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            {!isInitialSetup && (
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                    취소
                </button>
            )}
            <button
                onClick={handleSave}
                disabled={testStatus !== 'success'}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save className="w-4 h-4" />
                {isInitialSetup ? '설정 완료 및 시작' : '설정 저장'}
            </button>
        </div>
      </div>
    </div>
  );
};