// Tipos de usuario
export interface User {
  id: string | number;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'teacher' | 'admin' | 'estudiante' | 'docente';
  description?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  lastLogin?: Date | string;
  isActive?: boolean;
  provider?: string;
  phoneNumber?: string;
  bio?: string;
  isEmailVerified?: boolean;
  is2FAEnabled?: boolean;
  fcmToken?: string;
}

// Estadísticas del usuario
export interface UserStatistics {
  coursesImpartidos: number;
  tareasCreadas: number;
  estudiantesTotales: number;
}

// Perfil completo del usuario
export interface UserProfile {
  user: User;
  statistics: UserStatistics;
}

// Curso del docente con estadísticas
export interface TeacherCourse {
  id: string | number;
  name: string;
  description: string;
  subject: string;
  grade: string;
  semester: string;
  year: number;
  color: string;
  imageURL?: string;
  joinCode: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  teacherRole: 'owner' | 'teacher';
  studentCount: number;
  assignmentCount: number;
}

// Tipos de curso
export interface Course {
  id: string;
  name: string;
  description: string;
  code: string;
  teacherId: string;
  teacherName: string;
  teacherPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  color: string;
  subject?: string;
  grade?: string;
  academicYear?: string;
}

// Tipos de miembro del curso
export interface CourseMember {
  id: string;
  userId: string;
  courseId: string;
  role: 'teacher' | 'student';
  joinedAt: Date;
  displayName: string;
  photoURL?: string;
  email: string;
}

// Tipos de publicación
export interface Post {
  id: string;
  courseId: string;
  title: string;
  content: string;
  type: 'announcement' | 'assignment' | 'material';
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  maxPoints?: number;
  attachments: Attachment[];
  isPublished: boolean;
}

// Tipos de archivo adjunto
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

// Tipos de comentario
export interface Comment {
  id: string;
  postId: string;
  courseId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de entrega
export interface Submission {
  id: string;
  postId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  content?: string;
  attachments: Attachment[];
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: string;
  isLate: boolean;
}

// Tipos de sesión de asistencia
export interface AttendanceSession {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // en metros
  };
  qrTokens: QRToken[];
}

// Tipos de token QR
export interface QRToken {
  id: string;
  sessionId: string;
  courseId: string;
  studentId: string;
  token: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

// Tipos de registro de asistencia
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  status: 'present' | 'absent' | 'late';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  qrTokenId: string;
}

// Tipos de mensaje
export interface Message {
  id: string;
  courseId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  attachments: Attachment[];
}

// Tipos de notificación
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'post' | 'comment' | 'submission' | 'grade' | 'attendance' | 'message';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

// Tipos de estado de autenticación
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Tipos de estado de la aplicación
export interface AppState {
  currentCourse: Course | null;
  courses: Course[];
  loading: boolean;
  error: string | null;
}

// Tipos para formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: 'student' | 'teacher';
}

export interface CourseForm {
  name: string;
  description: string;
  subject?: string;
  grade?: string;
  academicYear?: string;
  color: string;
}

export interface PostForm {
  title: string;
  content: string;
  type: 'announcement' | 'assignment' | 'material';
  dueDate?: Date;
  maxPoints?: number;
  attachments: File[];
}

export interface CommentForm {
  content: string;
}

export interface SubmissionForm {
  content?: string;
  attachments: File[];
}

export interface AttendanceSessionForm {
  title: string;
  description?: string;
  duration: number; // en minutos
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface MessageForm {
  content: string;
  attachments: File[];
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Tipos para filtros y búsqueda
export interface CourseFilters {
  search?: string;
  subject?: string;
  grade?: string;
  academicYear?: string;
  isActive?: boolean;
}

export interface PostFilters {
  type?: 'announcement' | 'assignment' | 'material';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Tipos para estadísticas
export interface CourseStats {
  totalStudents: number;
  totalPosts: number;
  totalSubmissions: number;
  averageGrade: number;
  attendanceRate: number;
}

export interface UserStats {
  totalCourses: number;
  totalSubmissions: number;
  averageGrade: number;
  attendanceRate: number;
} 