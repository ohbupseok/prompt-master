export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  variables: string[];
  createdAt: number;
}

export type Category = string;

export interface ExecutionResult {
  text: string;
  timestamp: number;
  model: string;
}

export interface PromptExecutionState {
  isLoading: boolean;
  result: ExecutionResult | null;
  error: string | null;
}

export interface AppSettings {
  apiKey: string;
  localPath: string;
  isConfigured: boolean;
}