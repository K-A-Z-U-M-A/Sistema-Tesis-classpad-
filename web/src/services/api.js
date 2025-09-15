const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    console.log('🔍 API Request:');
    console.log('  - endpoint:', endpoint);
    console.log('  - url:', url);
    console.log('  - hasToken:', !!token);
    console.log('  - tokenPreview:', token ? `${token.substring(0, 20)}...` : 'none');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('🔍 API Response:');
      console.log('  - endpoint:', endpoint);
      console.log('  - status:', response.status);
      console.log('  - ok:', response.ok);
      console.log('  - data:', data);

      if (!response.ok) {
        // Crear un error con el código y mensaje del backend
        const error = new Error(data.error?.message || `HTTP error! status: ${response.status}`);
        error.code = data.error?.code;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async register({ email, displayName, password, role }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, displayName, password, role }),
    });
  }

  async login({ email, password }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Google OAuth
  getGoogleAuthUrl() {
    return `${this.baseURL}/auth/google`;
  }

  // Token management
  setToken(token) {
    localStorage.setItem('authToken', token);
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // User profile methods
  async getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  async getUserProfileMe() {
    console.log('🔍 API - getUserProfileMe called');
    const result = await this.request('/users/me');
    console.log('🔍 API - getUserProfileMe result:', result);
    return result;
  }

  async updateUserProfile(userId, { displayName, photoURL, description }) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ displayName, photoURL, description }),
    });
  }

  // Teacher methods
  async getTeacherCourses(teacherId) {
    return this.request(`/teachers/${teacherId}/courses`);
  }

  async getTeacherStudents(teacherId) {
    return this.request(`/teachers/${teacherId}/students`);
  }
}

export default new ApiService();
