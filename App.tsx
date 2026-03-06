import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { PromptCard } from './components/PromptCard';
import { CategoryFilter } from './components/CategoryFilter';
import { PromptEditor } from './components/PromptEditor';
import { VariableInputForm } from './components/VariableInputForm';
import { ExecutionResult as ExecutionResultView } from './components/ExecutionResult';
import { SettingsView } from './components/SettingsView';
import { generateContent } from './services/geminiService';
import { saveLibraryToDirectory } from './services/fileService';
import { PromptExecutionState, PromptTemplate } from './types';
import { Plus, Search, Command, LayoutGrid, Settings, Youtube, Download } from 'lucide-react';

type View = 'list' | 'create' | 'edit' | 'run' | 'settings';

const App: React.FC = () => {
  const { 
    prompts, 
    activeCategory, 
    searchQuery, 
    settings,
    setCategory, 
    setSearchQuery, 
    addPrompt, 
    updatePrompt, 
    deletePrompt,
    getDecryptedApiKey
  } = useStore();
  
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<PromptExecutionState>({
    isLoading: false,
    result: null,
    error: null,
  });

  // 초기 실행 시 설정 확인
  useEffect(() => {
    if (!settings.isConfigured) {
        setCurrentView('settings');
    }
  }, [settings.isConfigured]);

  const filteredPrompts = prompts.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  const handleSavePrompt = (data: Omit<PromptTemplate, 'id' | 'createdAt'>) => {
    if (selectedPromptId && currentView === 'edit') {
      updatePrompt(selectedPromptId, data);
    } else {
      addPrompt(data);
    }
    setCurrentView('list');
    setSelectedPromptId(null);
  };

  const handleRunPrompt = async (values: Record<string, string>) => {
    if (!selectedPrompt) return;

    setExecutionState({ isLoading: true, result: null, error: null });

    let finalContent = selectedPrompt.content;
    Object.entries(values).forEach(([key, value]) => {
      finalContent = finalContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });

    try {
      // Store에서 복호화된 API Key 가져오기
      const apiKey = getDecryptedApiKey();
      const text = await generateContent(finalContent, apiKey);
      setExecutionState({
        isLoading: false,
        result: {
          text,
          timestamp: Date.now(),
          model: 'gemini-3-flash-preview',
        },
        error: null,
      });
    } catch (error: any) {
      setExecutionState({
        isLoading: false,
        result: null,
        error: error.message || '알 수 없는 오류가 발생했습니다.',
      });
    }
  };

  const handleBackupLibrary = async () => {
    if (prompts.length === 0) {
        alert("저장할 프롬프트가 없습니다.");
        return;
    }
    
    // 폴더를 선택하고 카테고리별로 저장하는 로직으로 변경
    await saveLibraryToDirectory(prompts);
  };

  const renderContent = () => {
    // 설정이 안되어있으면 무조건 설정화면 보여주기
    if (!settings.isConfigured || currentView === 'settings') {
        return (
            <SettingsView 
                isInitialSetup={!settings.isConfigured} 
                onClose={() => setCurrentView('list')} 
            />
        );
    }

    if (currentView === 'create' || (currentView === 'edit' && selectedPrompt)) {
      return (
        <div className="max-w-4xl mx-auto h-full">
            <PromptEditor
            initialData={currentView === 'edit' ? selectedPrompt : undefined}
            onSave={handleSavePrompt}
            onCancel={() => {
                setCurrentView('list');
                setSelectedPromptId(null);
            }}
            />
        </div>
      );
    }

    if (currentView === 'run' && selectedPrompt) {
      return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <button 
                        onClick={() => setCurrentView('list')} 
                        className="text-sm text-slate-500 hover:text-slate-800 mb-1 flex items-center gap-1 transition-colors"
                    >
                        ← 돌아가기
                    </button>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {selectedPrompt.title}
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">실행 모드</span>
                    </h2>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]">
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <VariableInputForm
                        variables={selectedPrompt.variables}
                        promptTitle={selectedPrompt.title}
                        promptDescription={selectedPrompt.description}
                        onExecute={handleRunPrompt}
                        isExecuting={executionState.isLoading}
                    />
                    <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
                         <h4 className="font-semibold text-slate-700 mb-2 text-sm">프롬프트 미리보기</h4>
                         <p className="text-slate-500 text-xs font-mono whitespace-pre-wrap leading-relaxed line-clamp-6 bg-white p-3 rounded border border-slate-200">
                             {selectedPrompt.content}
                         </p>
                    </div>
                </div>
                <div className="lg:col-span-8 h-full">
                    <ExecutionResultView
                        result={executionState.result}
                        error={executionState.error}
                        onRetry={() => executionState.error && handleRunPrompt({})} 
                    />
                </div>
            </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">라이브러리</h1>
            <p className="text-slate-500 mt-1">
                <span className="font-semibold text-blue-600">{settings.localPath}</span> 경로에서 불러온 프롬프트 목록입니다.
            </p>
          </div>
          
          <button
            onClick={() => setCurrentView('create')}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            새 프롬프트
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-full md:w-auto">
                <CategoryFilter activeCategory={activeCategory} onSelect={setCategory} />
            </div>
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                type="text"
                placeholder="프롬프트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                />
            </div>
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">프롬프트를 찾을 수 없습니다</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              검색어를 변경하거나 새로운 프롬프트 템플릿을 만들어보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={(id) => {
                  setSelectedPromptId(id);
                  setCurrentView('edit');
                }}
                onRun={(id) => {
                  setSelectedPromptId(id);
                  setExecutionState({ isLoading: false, result: null, error: null });
                  setCurrentView('run');
                }}
                onDelete={deletePrompt}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white h-screen sticky top-0 overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Command className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-wide">Prompt Master</span>
                </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
                <button 
                    onClick={() => {
                        if (settings.isConfigured) {
                            setCurrentView('list');
                            setCategory('All');
                            setSearchQuery('');
                        }
                    }}
                    disabled={!settings.isConfigured}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentView === 'list' || currentView === 'run' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                    <LayoutGrid className="w-5 h-5" />
                    <span className="font-medium">라이브러리</span>
                </button>
                <button 
                     onClick={() => {
                        if (settings.isConfigured) setCurrentView('create');
                     }}
                     disabled={!settings.isConfigured}
                     className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentView === 'create' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">새 프롬프트</span>
                </button>

                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    시스템
                </div>
                <button 
                     onClick={handleBackupLibrary}
                     disabled={!settings.isConfigured}
                     className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">라이브러리 백업</span>
                </button>
                <button 
                     onClick={() => setCurrentView('settings')}
                     className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentView === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">환경 설정</span>
                </button>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <a 
                    href="https://www.youtube.com/@AIFACT-GPTPARK" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors py-2 border border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-800"
                >
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span>Created by GPT PARK</span>
                </a>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-auto">
            <header className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-2">
                    <Command className="w-5 h-5 text-blue-400" />
                    <span className="font-bold">Prompt Master</span>
                </div>
                <button onClick={() => setCurrentView('settings')} className="text-slate-300 hover:text-white">
                    <Settings className="w-6 h-6" />
                </button>
            </header>

            <div className="p-4 md:p-8 lg:p-10">
                {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;