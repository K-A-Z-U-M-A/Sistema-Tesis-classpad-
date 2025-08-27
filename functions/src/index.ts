import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as nodemailer from 'nodemailer';

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Función para generar tokens QR únicos
export const generateQRTokens = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { courseId, sessionId, studentIds, duration } = data;

  try {
    // Verificar que el usuario es docente del curso
    const courseMember = await db
      .collection('courses')
      .doc(courseId)
      .collection('members')
      .doc(context.auth.uid)
      .get();

    if (!courseMember.exists || courseMember.data()?.role !== 'teacher') {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para esta acción');
    }

    const tokens = [];
    const expiresAt = new Date(Date.now() + duration * 60 * 1000); // Convertir minutos a milisegundos

    for (const studentId of studentIds) {
      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      
      // Crear documento del token
      const tokenDoc = {
        sessionId,
        courseId,
        studentId,
        token,
        isUsed: false,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('qr-tokens').doc(token).set(tokenDoc);
      
      // Generar QR
      const qrData = JSON.stringify({
        token,
        sessionId,
        courseId,
        studentId,
        expiresAt: expiresAt.toISOString(),
      });
      
      const qrCode = await QRCode.toDataURL(qrData);
      
      tokens.push({
        studentId,
        token,
        qrCode,
        expiresAt,
      });
    }

    return { tokens };
  } catch (error) {
    console.error('Error generando tokens QR:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para validar token QR
export const validateQRToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { token, location } = data;

  try {
    // Buscar el token en la base de datos
    const tokenDoc = await db.collection('qr-tokens').doc(token).get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Token no válido');
    }

    const tokenData = tokenDoc.data()!;

    // Verificar que el token no haya expirado
    if (tokenData.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Token expirado');
    }

    // Verificar que el token no haya sido usado
    if (tokenData.isUsed) {
      throw new functions.https.HttpsError('already-exists', 'Token ya utilizado');
    }

    // Verificar que el usuario es el propietario del token
    if (tokenData.studentId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Token no válido para este usuario');
    }

    // Marcar token como usado
    await tokenDoc.ref.update({
      isUsed: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Crear registro de asistencia
    const attendanceRecord = {
      sessionId: tokenData.sessionId,
      courseId: tokenData.courseId,
      studentId: tokenData.studentId,
      status: 'present',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      qrTokenId: token,
      location: location || null,
    };

    await db
      .collection('courses')
      .doc(tokenData.courseId)
      .collection('attendance-sessions')
      .doc(tokenData.sessionId)
      .collection('records')
      .add(attendanceRecord);

    return { success: true, message: 'Asistencia registrada correctamente' };
  } catch (error) {
    console.error('Error validando token QR:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para enviar notificaciones
export const sendNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { userId, title, body, type, data: notificationData } = data;

  try {
    const notification = {
      userId,
      title,
      body,
      type,
      data: notificationData || {},
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('notifications').add(notification);

    // TODO: Implementar envío de notificación push usando FCM
    // const userDoc = await db.collection('users').doc(userId).get();
    // const fcmToken = userDoc.data()?.fcmToken;
    // if (fcmToken) {
    //   await admin.messaging().send({
    //     token: fcmToken,
    //     notification: { title, body },
    //     data: notificationData,
    //   });
    // }

    return { success: true };
  } catch (error) {
    console.error('Error enviando notificación:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para crear usuario en Firestore cuando se registra
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    const userProfile = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName || 'Usuario',
      photoURL: user.photoURL || null,
      role: 'student', // Por defecto
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isEmailVerified: user.emailVerified,
      is2FAEnabled: false,
    };

    await db.collection('users').doc(user.uid).set(userProfile);
  } catch (error) {
    console.error('Error creando perfil de usuario:', error);
  }
});

// Función para actualizar perfil de usuario cuando cambia en Auth
export const updateUserProfile = functions.auth.user().onUpdate(async (change) => {
  try {
    const before = change.before;
    const after = change.after;

    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (before.displayName !== after.displayName) {
      updates.displayName = after.displayName;
    }

    if (before.photoURL !== after.photoURL) {
      updates.photoURL = after.photoURL;
    }

    if (before.emailVerified !== after.emailVerified) {
      updates.isEmailVerified = after.emailVerified;
    }

    if (Object.keys(updates).length > 1) { // Más de 1 porque siempre incluimos updatedAt
      await db.collection('users').doc(after.uid).update(updates);
    }
  } catch (error) {
    console.error('Error actualizando perfil de usuario:', error);
  }
});

// Función para limpiar tokens QR expirados (ejecutar diariamente)
export const cleanupExpiredTokens = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const now = new Date();
    const expiredTokens = await db
      .collection('qr-tokens')
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    expiredTokens.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Eliminados ${expiredTokens.size} tokens expirados`);
  } catch (error) {
    console.error('Error limpiando tokens expirados:', error);
  }
}); 