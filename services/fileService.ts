import { PromptTemplate } from "../types";

export const saveToFile = async (content: string, filename: string, mimeType = 'text/plain', description = 'Text File') => {
  try {
    // Cast window to any to access File System Access API
    const win = window as any;
    if (win.showSaveFilePicker) {
      const handle = await win.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: description,
          accept: { [mimeType]: ['.txt', '.md', '.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } else {
      // Legacy method (Download link)
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('File save failed:', err);
      alert('파일 저장 중 오류가 발생했습니다.');
    }
    return false;
  }
};

export const saveLibraryToDirectory = async (prompts: PromptTemplate[]) => {
    const win = window as any;
    
    if (!win.showDirectoryPicker) {
        alert("이 브라우저는 폴더 저장 기능을 지원하지 않습니다.\n대신 전체 라이브러리를 단일 파일로 다운로드합니다.");
        const content = JSON.stringify(prompts, null, 2);
        return saveToFile(content, 'Prompt_Library_Full.json', 'application/json', 'JSON File');
    }

    try {
        // 1. Open Directory Picker
        const dirHandle = await win.showDirectoryPicker();
        
        // 2. Group prompts by category
        const promptsByCategory: Record<string, PromptTemplate[]> = {};
        
        prompts.forEach(prompt => {
            const cat = prompt.category || 'Uncategorized';
            if (!promptsByCategory[cat]) {
                promptsByCategory[cat] = [];
            }
            promptsByCategory[cat].push(prompt);
        });

        // 3. Write each category to a separate file
        let savedCount = 0;
        for (const [category, categoryPrompts] of Object.entries(promptsByCategory)) {
            // Clean filename
            const filename = `${category.replace(/[^a-z0-9]/gi, '_')}.json`;
            
            // Get file handle (create if doesn't exist)
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            
            await writable.write(JSON.stringify(categoryPrompts, null, 2));
            await writable.close();
            savedCount++;
        }

        alert(`${savedCount}개의 카테고리 파일이 성공적으로 저장되었습니다.`);
        return true;

    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('Directory save failed:', err);
            alert('폴더 저장 중 오류가 발생했습니다.');
        }
        return false;
    }
};