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
  ]);

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
  ]);

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
    }
  ]);

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

  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      courseId: 'course-1',
      senderId: 'demo-teacher-1',
      senderName: 'Ingeniero Carlos García',
      content: 'Recordatorio: La tarea de Matemática I se entrega el próximo viernes',
      timestamp: new Date('2024-03-12T10:00:00'),
      type: 'announcement'
    }
  ]);

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

  const sendMessage = (messageData) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      ...messageData,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

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






