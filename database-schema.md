# Diagrama de Base de Datos Firestore

## Estructura de Colecciones

### 1. Colección: `users`
```
users/{userId}
├── email: string
├── displayName: string
├── photoURL: string
├── role: "admin" | "teacher" | "student"
├── phoneNumber: string
├── createdAt: timestamp
├── lastLogin: timestamp
├── isEmailVerified: boolean
├── twoFactorEnabled: boolean
└── courses: {
    enrolled: [courseId1, courseId2, ...],
    teaching: [courseId1, courseId2, ...]
}
```

### 2. Colección: `courses`
```
courses/{courseId}
├── name: string
├── description: string
├── subject: string
├── grade: string
├── semester: string
├── year: number
├── color: string
├── imageURL: string
├── ownerId: string (userId del docente creador)
├── teachers: {
    [teacherId]: {
        role: "owner" | "co-teacher",
        addedAt: timestamp,
        permissions: ["manage_students", "create_assignments", "grade_submissions"]
    }
}
├── students: {
    [studentId]: {
        enrolledAt: timestamp,
        status: "active" | "inactive"
    }
}
├── joinCode: string
├── isActive: boolean
├── createdAt: timestamp
├── updatedAt: timestamp
└── settings: {
    allowStudentPosts: boolean,
    allowComments: boolean,
    requireApproval: boolean
}
```

### 3. Subcolección: `courses/{courseId}/units`
```
courses/{courseId}/units/{unitId}
├── title: string
├── description: string
├── order: number
├── isPublished: boolean
├── createdAt: timestamp
├── updatedAt: timestamp
└── materials: [{
    id: string,
    type: "file" | "link" | "text",
    title: string,
    url: string,
    fileSize: number,
    uploadedAt: timestamp
}]
```

### 4. Subcolección: `courses/{courseId}/assignments`
```
courses/{courseId}/assignments/{assignmentId}
├── title: string
├── description: string
├── unitId: string (opcional, si pertenece a una unidad)
├── dueDate: timestamp
├── maxPoints: number
├── allowLateSubmission: boolean
├── latePenalty: number
├── isPublished: boolean
├── createdAt: timestamp
├── updatedAt: timestamp
├── attachments: [{
    id: string,
    type: "file" | "link",
    title: string,
    url: string,
    fileSize: number
}]
└── rubric: [{
    criterion: string,
    points: number,
    description: string
}]
```

### 5. Subcolección: `courses/{courseId}/assignments/{assignmentId}/submissions`
```
courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}
├── studentId: string
├── submittedAt: timestamp
├── submittedLate: boolean
├── grade: number
├── feedback: string
├── gradedBy: string (teacherId)
├── gradedAt: timestamp
├── status: "submitted" | "graded" | "late"
└── files: [{
    id: string,
    name: string,
    url: string,
    fileSize: number,
    uploadedAt: timestamp
}]
```

### 6. Subcolección: `courses/{courseId}/attendance`
```
courses/{courseId}/attendance/{sessionId}
├── date: timestamp
├── title: string
├── description: string
├── startTime: timestamp
├── endTime: timestamp
├── isActive: boolean
├── locationRequired: boolean
├── allowedLocation: {
    latitude: number,
    longitude: number,
    radius: number
}
├── createdAt: timestamp
└── qrTokens: {
    [studentId]: {
        token: string,
        qrCode: string,
        expiresAt: timestamp,
        isUsed: boolean,
        usedAt: timestamp,
        location: {
            latitude: number,
            longitude: number
        }
    }
}
```

### 7. Subcolección: `courses/{courseId}/messages`
```
courses/{courseId}/messages/{messageId}
├── authorId: string
├── authorName: string
├── authorPhoto: string
├── content: string
├── type: "announcement" | "discussion" | "question"
├── isPinned: boolean
├── createdAt: timestamp
├── updatedAt: timestamp
├── attachments: [{
    id: string,
    type: "file" | "link",
    title: string,
    url: string
}]
└── comments: [{
    id: string,
    authorId: string,
    authorName: string,
    content: string,
    createdAt: timestamp
}]
```

### 8. Colección: `notifications`
```
notifications/{notificationId}
├── userId: string
├── courseId: string
├── type: "assignment" | "announcement" | "grade" | "reminder"
├── title: string
├── message: string
├── isRead: boolean
├── createdAt: timestamp
├── scheduledFor: timestamp (para recordatorios)
└── data: {
    assignmentId: string,
    courseName: string,
    actionUrl: string
}
```

### 9. Colección: `files`
```
files/{fileId}
├── name: string
├── originalName: string
├── type: string
├── size: number
├── url: string
├── uploadedBy: string (userId)
├── courseId: string
├── assignmentId: string (opcional)
├── unitId: string (opcional)
├── uploadedAt: timestamp
└── metadata: {
    description: string,
    tags: [string]
}
```

## Índices Recomendados

### Índices Compuestos
1. `users` - `role` + `createdAt`
2. `courses` - `ownerId` + `isActive`
3. `courses` - `joinCode` + `isActive`
4. `assignments` - `courseId` + `dueDate`
5. `assignments` - `courseId` + `isPublished`
6. `submissions` - `assignmentId` + `submittedAt`
7. `submissions` - `studentId` + `submittedAt`
8. `attendance` - `courseId` + `date`
9. `messages` - `courseId` + `createdAt`
10. `notifications` - `userId` + `isRead` + `createdAt`

### Índices de Array
1. `users` - `courses.enrolled`
2. `users` - `courses.teaching`

## Consideraciones de Seguridad

- Todas las operaciones requieren autenticación
- Los usuarios solo pueden acceder a cursos donde están inscritos o enseñando
- Los estudiantes solo pueden ver sus propias entregas
- Los docentes pueden ver todas las entregas de su curso
- Las reglas de Firestore implementan estas restricciones
