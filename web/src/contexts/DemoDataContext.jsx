import React, { createContext, useContext, useState } from 'react';

const DemoDataContext = createContext();

export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData debe ser usado dentro de un DemoDataProvider');
  }
  return context;
};

export const DemoDataProvider = ({ children }) => {
  // Datos mock para cursos
  const [courses, setCourses] = useState([
    {
      id: 'course-1',
      name: 'Matemáticas Avanzadas',
      subject: 'Matemáticas',
      description: 'Curso de matemáticas para estudiantes avanzados',
      grade: '3er Año',
      maxStudents: 30,
      joinCode: 'MATH2024',
      color: '#007AFF',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Dr. Carlos García',
        email: 'profesor@demo.com'
      },
      students: [
        { uid: 'demo-student-1', name: 'María López', email: 'estudiante@demo.com' }
      ],
      createdAt: new Date('2024-01-15'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-2',
      name: 'Física Cuántica',
      subject: 'Física',
      description: 'Introducción a la física cuántica moderna',
      grade: '4to Año',
      maxStudents: 25,
      joinCode: 'PHYS2024',
      color: '#34C759',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Dr. Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: false,
        allowStudentComments: true
      }
    }
  ]);

  // Datos mock para unidades
  const [units, setUnits] = useState([
    {
      id: 'unit-1',
      courseId: 'course-1',
      title: 'Álgebra Lineal',
      description: 'Fundamentos del álgebra lineal y matrices',
      order: 1,
      isPublished: true,
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'unit-2',
      courseId: 'course-1',
      title: 'Cálculo Diferencial',
      description: 'Derivadas y aplicaciones',
      order: 2,
      isPublished: true,
      createdAt: new Date('2024-01-25')
    },
    {
      id: 'unit-3',
      courseId: 'course-2',
      title: 'Principios de Mecánica Cuántica',
      description: 'Conceptos básicos de la mecánica cuántica',
      order: 1,
      isPublished: true,
      createdAt: new Date('2024-02-05')
    }
  ]);

  // Datos mock para tareas
  const [assignments, setAssignments] = useState([
    {
      id: 'assignment-1',
      courseId: 'course-1',
      unitId: 'unit-1',
      title: 'Ejercicios de Matrices',
      description: 'Resolver los ejercicios 1-10 del capítulo 3',
      dueDate: new Date('2024-03-15'),
      maxPoints: 100,
      isPublished: true,
      createdAt: new Date('2024-01-22'),
      submissions: [
        {
          id: 'submission-1',
          studentId: 'demo-student-1',
          studentName: 'María López',
          submittedAt: new Date('2024-03-10'),
          grade: 95,
          feedback: 'Excelente trabajo, muy bien organizado',
          files: ['tarea-maria.pdf']
        }
      ]
    },
    {
      id: 'assignment-2',
      courseId: 'course-1',
      unitId: 'unit-2',
      title: 'Problemas de Derivadas',
      description: 'Aplicar las reglas de derivación en problemas prácticos',
      dueDate: new Date('2024-03-20'),
      maxPoints: 80,
      isPublished: true,
      createdAt: new Date('2024-01-28'),
      submissions: []
    }
  ]);

  // Datos mock para asistencias
  const [attendanceSessions, setAttendanceSessions] = useState([
    {
      id: 'session-1',
      courseId: 'course-1',
      title: 'Clase 15 de Marzo',
      date: new Date('2024-03-15'),
      startTime: '08:00',
      endTime: '09:30',
      qrCode: 'demo-qr-1',
      isActive: false,
      attendees: [
        { studentId: 'demo-student-1', name: 'María López', timestamp: new Date('2024-03-15T08:05:00') }
      ],
      createdAt: new Date('2024-03-15')
    }
  ]);

  // Datos mock para mensajes
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      courseId: 'course-1',
      senderId: 'demo-teacher-1',
      senderName: 'Dr. Carlos García',
      content: 'Recordatorio: La tarea de matrices se entrega el próximo viernes',
      timestamp: new Date('2024-03-12T10:00:00'),
      type: 'announcement'
    },
    {
      id: 'msg-2',
      courseId: 'course-1',
      senderId: 'demo-student-1',
      senderName: 'María López',
      content: '¿Podría explicar el ejercicio 7 de la tarea?',
      timestamp: new Date('2024-03-13T14:30:00'),
      type: 'question'
    }
  ]);

  // Función para crear un nuevo curso
  const createCourse = (courseData) => {
    const newCourse = {
      id: `course-${Date.now()}`,
      ...courseData,
      students: [],
      createdAt: new Date(),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  // Función para crear una nueva unidad
  const createUnit = (unitData) => {
    const newUnit = {
      id: `unit-${Date.now()}`,
      ...unitData,
      isPublished: true,
      createdAt: new Date()
    };
    setUnits(prev => [...prev, newUnit]);
    return newUnit;
  };

  // Función para crear una nueva tarea
  const createAssignment = (assignmentData) => {
    const newAssignment = {
      id: `assignment-${Date.now()}`,
      ...assignmentData,
      isPublished: true,
      submissions: [],
      createdAt: new Date()
    };
    setAssignments(prev => [...prev, newAssignment]);
    return newAssignment;
  };

  // Función para crear una sesión de asistencia
  const createAttendanceSession = (sessionData) => {
    const newSession = {
      id: `session-${Date.now()}`,
      ...sessionData,
      qrCode: `demo-qr-${Date.now()}`,
      isActive: true,
      attendees: [],
      createdAt: new Date()
    };
    setAttendanceSessions(prev => [...prev, newSession]);
    return newSession;
  };

  // Función para enviar un mensaje
  const sendMessage = (messageData) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      ...messageData,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // Función para unirse a un curso
  const joinCourse = (courseId, studentData) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          students: [...course.students, studentData]
        };
      }
      return course;
    }));
  };

  const value = {
    courses,
    units,
    assignments,
    attendanceSessions,
    messages,
    createCourse,
    createUnit,
    createAssignment,
    createAttendanceSession,
    sendMessage,
    joinCourse
  };

  return (
    <DemoDataContext.Provider value={value}>
      {children}
    </DemoDataContext.Provider>
  );
};
