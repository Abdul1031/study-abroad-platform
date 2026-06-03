const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  get: async <T,>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  post: async <T,>(url: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  put: async <T,>(url: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  delete: async <T,>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
};
