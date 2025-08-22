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
  // Datos mock para cursos - Malla 2015 Ingeniería en Sistemas Informáticos
  const [courses, setCourses] = useState([
    {
      id: 'course-1',
      name: 'Matemática I',
      subject: 'Matemáticas',
      description: 'Fundamentos de matemáticas para ingeniería en sistemas',
      grade: '1er Semestre',
      semester: 1,
      code: 'ISI01',
      hours: 90,
      maxStudents: 30,
      joinCode: 'ISI012024',
      color: '#007AFF',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
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
      name: 'Computación I',
      subject: 'Computación',
      description: 'Introducción a la computación y sistemas informáticos',
      grade: '1er Semestre',
      semester: 1,
      code: 'ISI02',
      hours: 90,
      maxStudents: 25,
      joinCode: 'ISI022024',
      color: '#34C759',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: false,
        allowStudentComments: true
      }
    },
    {
      id: 'course-3',
      name: 'Informática I',
      subject: 'Informática',
      description: 'Fundamentos de informática y tecnologías de la información',
      grade: '1er Semestre',
      semester: 1,
      code: 'ISI03',
      hours: 90,
      maxStudents: 30,
      joinCode: 'ISI032024',
      color: '#FF9500',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-4',
      name: 'Algoritmia I',
      subject: 'Algoritmos',
      description: 'Fundamentos de algoritmos y programación básica',
      grade: '1er Semestre',
      semester: 1,
      code: 'ISI04',
      hours: 90,
      maxStudents: 25,
      joinCode: 'ISI042024',
      color: '#FF3B30',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-5',
      name: 'Inglés',
      subject: 'Idiomas',
      description: 'Inglés técnico para ingeniería en sistemas',
      grade: '1er Semestre',
      semester: 1,
      code: 'ISI05',
      hours: 90,
      maxStudents: 30,
      joinCode: 'ISI052024',
      color: '#5AC8FA',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-6',
      name: 'Matemática II',
      subject: 'Matemáticas',
      description: 'Continuación de matemáticas para ingeniería',
      grade: '2do Semestre',
      semester: 2,
      code: 'ISI06',
      hours: 90,
      maxStudents: 30,
      joinCode: 'ISI062024',
      color: '#AF52DE',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-7',
      name: 'Computación II',
      subject: 'Computación',
      description: 'Avanzado en computación y sistemas',
      grade: '2do Semestre',
      semester: 2,
      code: 'ISI07',
      hours: 90,
      maxStudents: 25,
      joinCode: 'ISI072024',
      color: '#FF2D92',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-8',
      name: 'Informática II',
      subject: 'Informática',
      description: 'Informática avanzada y aplicaciones',
      grade: '2do Semestre',
      semester: 2,
      code: 'ISI08',
      hours: 90,
      maxStudents: 30,
      joinCode: 'ISI082024',
      color: '#5856D6',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-9',
      name: 'Algoritmia II',
      subject: 'Algoritmos',
      description: 'Algoritmos avanzados y estructuras de datos',
      grade: '2do Semestre',
      semester: 2,
      code: 'ISI09',
      hours: 90,
      maxStudents: 25,
      joinCode: 'ISI092024',
      color: '#FF6B5E',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    },
    {
      id: 'course-10',
      name: 'Programación I',
      subject: 'Programación',
      description: 'Fundamentos de programación y desarrollo de software',
      grade: '2do Semestre',
      semester: 2,
      code: 'ISI10',
      hours: 90,
      maxStudents: 30,
      joinCode: 'ISI102024',
      color: '#4DA3FF',
      teacher: {
        uid: 'demo-teacher-1',
        name: 'Ingeniero Carlos García',
        email: 'profesor@demo.com'
      },
      students: [],
      createdAt: new Date('2024-02-01'),
      isActive: true,
      settings: {
        allowStudentPosts: true,
        allowStudentComments: true
      }
    }
  ]);

  // Datos mock para unidades
  const [units, setUnits] = useState([
    {
      id: 'unit-1',
      courseId: 'course-1',
      title: 'Fundamentos de Matemáticas',
      description: 'Conceptos básicos de matemáticas para ingeniería',
      order: 1,
      isPublished: true,
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'unit-2',
      courseId: 'course-1',
      title: 'Álgebra y Trigonometría',
      description: 'Álgebra lineal y funciones trigonométricas',
      order: 2,
      isPublished: true,
      createdAt: new Date('2024-01-25')
    },
    {
      id: 'unit-3',
      courseId: 'course-2',
      title: 'Introducción a la Computación',
      description: 'Conceptos básicos de computación y sistemas',
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
      title: 'Ejercicios de Fundamentos Matemáticos',
      description: 'Resolver los ejercicios 1-15 del capítulo 1 de Matemática I',
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
      title: 'Problemas de Álgebra y Trigonometría',
      description: 'Aplicar conceptos de álgebra lineal en problemas prácticos',
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
      senderName: 'Ingeniero Carlos García',
      content: 'Recordatorio: La tarea de Matemática I se entrega el próximo viernes',
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
