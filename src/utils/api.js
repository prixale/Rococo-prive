const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  get: async (path) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error en la petición');
      return res.json();
    } catch (error) {
      console.error('API GET Error:', error);
      return null;
    }
  },
  post: async (path, body) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error en la petición');
      return res.json();
    } catch (error) {
      console.error('API POST Error:', error);
      return null;
    }
  },
  put: async (path, body) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Error en la petición');
      return res.json();
    } catch (error) {
      console.error('API PUT Error:', error);
      return null;
    }
  }
};
