import { GoogleGenAI } from "@google/genai";

export const generateContent = async (promptText: string, apiKey?: string): Promise<string> => {
  // If apiKey is provided (e.g. from store), use it. Otherwise fallback to process.env (legacy/dev support)
  const keyToUse = apiKey || process.env.API_KEY || '';

  if (!keyToUse) {
    throw new Error("API Key가 설정되지 않았습니다. 설정 페이지에서 API Key를 입력해주세요.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptText,
    });
    
    return response.text || "생성된 내용이 없습니다.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('API_KEY_INVALID') || error.status === 400 || error.status === 403) {
        throw new Error("API Key가 유효하지 않습니다. 설정을 확인해주세요.");
    }
    throw new Error(`AI 응답 생성 중 오류가 발생했습니다: ${error.message}`);
  }
};

export const testConnection = async (apiKey: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        // Send a very minimal token request to test auth
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Hi',
        });
        return true;
    } catch (error) {
        console.error("Connection Test Failed:", error);
        return false;
    }
};