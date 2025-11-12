import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - usar la misma que la web
const API_BASE_URL = 'http://localhost:3001/api';
// Para usar en dispositivo físico, cambiar a la IP de tu máquina:
// const API_BASE_URL = 'http://192.168.1.X:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let token = await AsyncStorage.getItem('authToken');
    if (typeof token === 'string') {
      // Sanitize potential quotes/spaces
      token = token.replace(/^"|"$/g, '').trim();
    }

    console.log('🔍 API Request:');
    console.log('  - endpoint:', endpoint);
    console.log('  - url:', url);
    console.log('  - hasToken:', !!token);

    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('🔍 API Response:');
      console.log('  - endpoint:', endpoint);
      console.log('  - status:', response.status);
      console.log('  - ok:', response.ok);

      if (!response.ok) {
        const error = new Error(data.error?.message || `HTTP error! status: ${response.status}`);
        error.code = data.error?.code;
        error.status = response.status;
        
        // Si el token es inválido, limpiar AsyncStorage
        if (response.status === 401 && (error.code === 'INVALID_TOKEN' || error.message.includes('Invalid token'))) {
          console.log('🔍 Token inválido detectado, limpiando AsyncStorage');
          await this.logout();
        }
        
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
    console.log('🔍 API Service - Login called with:', { email, password: '***' });
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    console.log('🔍 API Service - Login result:', result);
    return result;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  // Token management
  async setToken(token) {
    await AsyncStorage.setItem('authToken', token);
  }

  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
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

  // My Profile shortcuts
  async getMyProfile() {
    return this.request('/users/me');
  }

  async updateMyProfile(data) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async checkProfileComplete() {
    return this.request('/users/me/profile-complete');
  }

  async getMyCourses() {
    return this.request('/users/me/courses');
  }

  async getMyAssignments() {
    return this.request('/users/me/assignments');
  }

  // Course management
  async createCourse(data) {
    return this.request('/courses', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCourse(id, data) {
    return this.request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCourse(id) {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  // Units
  async getUnits(courseId) {
    return this.request(`/courses/${courseId}/units`);
  }

  async createUnit(courseId, data) {
    return this.request(`/courses/${courseId}/units`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUnit(id, data) {
    return this.request(`/units/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteUnit(id) {
    return this.request(`/units/${id}`, { method: 'DELETE' });
  }

  // Materials
  async getMaterials(unitId) {
    return this.request(`/units/${unitId}/materials`);
  }

  async createMaterial(unitId, data) {
    return this.request(`/units/${unitId}/materials`, { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteMaterial(id) {
    return this.request(`/units/materials/${id}`, { method: 'DELETE' });
  }

  async getAssignmentMaterials(assignmentId) {
    return this.request(`/assignments/${assignmentId}/materials`);
  }

  // Assignments
  async getAssignments(unitId) {
    return this.request(`/units/${unitId}/assignments`);
  }

  async createAssignment(unitId, data) {
    return this.request(`/units/${unitId}/assignments`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAssignment(id, data) {
    return this.request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteAssignment(id) {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  async getSubmissions(assignmentId) {
    return this.request(`/assignments/${assignmentId}/submissions`);
  }

  async gradeSubmission(assignmentId, data) {
    return this.request(`/assignments/${assignmentId}/grade`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // Assignment Materials methods
  async uploadAssignmentMaterial(assignmentId, formData) {
    console.log('🔍 Upload material - assignmentId:', assignmentId);
    return this.request(`/assignments/${assignmentId}/materials/upload`, {
      method: 'POST',
      body: formData,
      headers: {} // Let fetch set Content-Type for FormData
    });
  }

  async deleteAssignmentMaterial(materialId) {
    return this.request(`/assignments/materials/${materialId}`, { method: 'DELETE' });
  }

  // Teacher methods
  async getTeacherCourses(teacherId) {
    return this.request(`/teachers/${teacherId}/courses`);
  }

  async getTeacherStudents(teacherId) {
    return this.request(`/teachers/${teacherId}/students`);
  }

  // Submission methods
  async getMySubmission(assignmentId) {
    return this.request(`/submissions/my/${assignmentId}`);
  }

  async createSubmission(data) {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async uploadSubmissionFile(submissionId, formData) {
    return this.request(`/submissions/${submissionId}/files`, {
      method: 'POST',
      body: formData,
      headers: {} // Let fetch set Content-Type for FormData
    });
  }

  async deleteSubmissionFile(submissionId, fileId) {
    return this.request(`/submissions/${submissionId}/files/${fileId}`, {
      method: 'DELETE'
    });
  }

  async getAssignmentSubmissions(assignmentId) {
    return this.request(`/submissions/assignment/${assignmentId}`);
  }

  // Comment methods
  async addCommentToMessage(messageId, content) {
    return this.request(`/messages/${messageId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async updateComment(commentId, content) {
    return this.request(`/messages/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async deleteComment(commentId) {
    return this.request(`/messages/comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  // Notification methods
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unread_only: 'true' })
    });
    return this.request(`/notifications?${params}`);
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  // Student management methods
  async getCourseStudents(courseId) {
    return this.request(`/courses/${courseId}/students`);
  }

  async enrollStudent(courseId, { cedula, nombre, email }) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ cedula, nombre, email })
    });
  }

  async unenrollStudent(courseId, studentId) {
    return this.request(`/courses/${courseId}/students/${studentId}`, {
      method: 'DELETE'
    });
  }

  // Attendance methods
  async createAttendanceSession(data) {
    return this.request('/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAttendanceSession(sessionId) {
    return this.request(`/attendance/sessions/${sessionId}`);
  }

  async getCourseAttendanceSessions(courseId) {
    return this.request(`/attendance/courses/${courseId}/sessions`);
  }

  async getSessionAttendanceRecords(sessionId) {
    return this.request(`/attendance/sessions/${sessionId}/records`);
  }

  async scanQR(qrToken, location) {
    return this.request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ qr_token: qrToken, ...location })
    });
  }

  async recordManualAttendance(data) {
    return this.request('/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async markHoliday(data) {
    return this.request('/attendance/holidays', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deactivateAttendanceSession(sessionId) {
    return this.request(`/attendance/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async getCourseAttendanceStats(courseId) {
    return this.request(`/attendance/courses/${courseId}/stats`);
  }

  // Message methods
  async getMessages(courseId) {
    return this.request(`/messages/${courseId}`);
  }

  async createMessage(courseId, data) {
    return this.request(`/messages/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export default new ApiService();

