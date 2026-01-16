import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Helper to extract error message from axios errors
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // FastAPI returns errors in detail field
    return error.response?.data?.detail || error.message;
  }
  return error instanceof Error ? error.message : 'Unknown error';
};

export interface TemplateFields {
  template_id: string;
  fields: string[];
  loops: Record<string, string[]>;
  conditionals: string[];  // Boolean conditional sections
  syntax: string;  // 'jinja2' or 'single_brace'
  hints?: string[];  // Suggestions if non-Jinja2 patterns detected
}

export interface GenerateRequest {
  template_id: string;
  data: Record<string, unknown>;
}

export const uploadTemplate = async (file: File): Promise<TemplateFields> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<TemplateFields>(`${API_BASE}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const generateDocument = async (request: GenerateRequest): Promise<Blob> => {
  const response = await axios.post(`${API_BASE}/generate`, request, {
    responseType: 'blob',
  });

  return response.data;
};
