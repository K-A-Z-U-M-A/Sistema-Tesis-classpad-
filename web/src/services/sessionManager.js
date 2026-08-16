/**
 * Session Manager - Maneja múltiples sesiones en la misma máquina
 * Usa sessionStorage para identificar cada ventana/pestaña y localStorage
 * con claves prefijadas para almacenar datos de sesión
 */

class SessionManager {
  constructor() {
    // Inicializar el sessionId de forma lazy para asegurar que se crea correctamente
    this._sessionId = null;
    this._storagePrefix = null;
    this._isInitialized = false;
    this._tabFingerprint = null;

    this.init();
  }

  /**
   * Genera una huella digital única para esta pestaña/ventana
   * Se persiste en sessionStorage para que sobreviva a recargas
   * pero se regenera si se detecta una duplicación
   */
  generateTabFingerprint() {
    // Combinar múltiples factores que son únicos por pestaña
    const factors = [
      performance.now().toString(36),
      Math.random().toString(36).substring(2, 15),
      Date.now().toString(36),
      Math.random().toString(36).substring(2, 15) // Más entropía
    ];
    return `tab_${factors.join('_')}`;
  }

  /**
   * Obtiene o crea la huella digital de esta pestaña
   * IMPORTANTE: El tabFingerprint se persiste en sessionStorage para sobrevivir recargas
   * pero NO se copia al duplicar pestañas (sessionStorage es único por pestaña)
   */
  getOrCreateTabFingerprint() {
    if (this._tabFingerprint) {
      return this._tabFingerprint;
    }

    // Intentar recuperar de sessionStorage primero
    try {
      const stored = sessionStorage.getItem('app_tab_fingerprint');
      if (stored) {
        this._tabFingerprint = stored;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 TabFingerprint recuperado de sessionStorage: ${this._tabFingerprint.substring(0, 20)}...`);
        }
        return this._tabFingerprint;
      }
    } catch (e) {
      console.warn('Error accediendo a sessionStorage para tabFingerprint:', e);
    }

    // Si no existe, generar uno nuevo y persistirlo
    this._tabFingerprint = this.generateTabFingerprint();

    // Persistir en sessionStorage para que sobreviva a recargas
    try {
      sessionStorage.setItem('app_tab_fingerprint', this._tabFingerprint);
    } catch (e) {
      console.warn('Error guardando tabFingerprint en sessionStorage:', e);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Nuevo tabFingerprint generado y persistido: ${this._tabFingerprint.substring(0, 20)}...`);
    }

    return this._tabFingerprint;
  }

  /**
   * Verifica si hay datos en localStorage con un sessionId pero con un fingerprint diferente
   * Esto indica que es una pestaña duplicada
   */
  hasDataWithDifferentFingerprint(sessionId, fingerprint) {
    try {
      const prefix = `session_${sessionId}_`;
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.startsWith(prefix)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const data = JSON.parse(stored);
              // Si hay datos con este sessionId pero con otro fingerprint, es una duplicación
              if (data.sessionId === sessionId && data.tabFingerprint && data.tabFingerprint !== fingerprint) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn(`   Encontrados datos con sessionId ${sessionId.substring(0, 12)}... pero fingerprint diferente: ${data.tabFingerprint.substring(0, 12)}...`);
                }
                return true;
              }
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Obtiene la huella digital de esta pestaña
   */
  getTabFingerprint() {
    return this.getOrCreateTabFingerprint();
  }

  /**
   * Inicializa el sessionManager - asegura que cada pestaña tenga su propio ID
   * ESTRATEGIA: 
   * - sessionId se persiste en sessionStorage (puede copiarse al duplicar)
   * - tabFingerprint se persiste en sessionStorage (sobrevive recargas, NO se copia al duplicar)
   * - Al leer datos, verificamos sessionId Y tabFingerprint
   * - Si tabFingerprint no coincide, es otra pestaña y NO leemos los datos
   */
  init() {
    if (this._isInitialized) return;

    // Obtener o crear sessionId desde sessionStorage
    this._sessionId = this.getOrCreateSessionId();

    // Obtener o crear tabFingerprint (se persiste en sessionStorage para sobrevivir recargas)
    // Esto asegura que cada pestaña tenga su propio fingerprint único que persiste
    this._tabFingerprint = this.getOrCreateTabFingerprint();

    this._storagePrefix = `session_${this._sessionId}_`;
    this._isInitialized = true;

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 SessionManager inicializado - SessionID: ${this._sessionId.substring(0, 20)}...`);
      console.log(`🔐 TabFingerprint (único): ${this._tabFingerprint.substring(0, 20)}...`);
      console.log(`🔐 Storage prefix: ${this._storagePrefix.substring(0, 30)}...`);
    }
  }

  /**
   * Verifica si hay datos en localStorage con un sessionId y fingerprint específicos
   */
  hasDataWithFingerprint(sessionId, fingerprint) {
    try {
      const prefix = `session_${sessionId}_`;
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.startsWith(prefix)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const data = JSON.parse(stored);
              if (data.sessionId === sessionId && data.tabFingerprint === fingerprint) {
                return true;
              }
            }
          } catch (e) {
            // Ignorar errores
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Crea un nuevo sessionId único
   * Este método SIEMPRE genera un nuevo ID, no verifica si existe uno anterior
   */
  createNewSessionId() {
    // Crear un nuevo ID de sesión único con máxima entropía
    const timestamp = performance.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    let random3 = '';
    try {
      random3 = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    } catch (e) {
      random3 = Math.random().toString(36).substring(2, 15);
    }
    return `sess_${timestamp}_${random}_${random2}_${random3}`;
  }

  /**
   * Obtiene o crea un ID de sesión único para esta ventana/pestaña
   * DETECCIÓN DE DUPLICADOS: Si sessionStorage tiene un sessionId pero localStorage
   * no tiene datos válidos para ese sessionId, es probable que sea una pestaña duplicada
   */
  getOrCreateSessionId() {
    let sessionId = null;

    try {
      sessionId = sessionStorage.getItem('app_session_id');
    } catch (e) {
      console.warn('Error accediendo a sessionStorage:', e);
    }

    // Si existe un sessionId, verificar si es válido para esta pestaña
    if (sessionId) {
      // Verificar si hay datos en localStorage para este sessionId
      const testKey = `session_${sessionId}_authToken`;
      const tokenData = localStorage.getItem(testKey);

      if (tokenData) {
        // Hay datos para este sessionId - verificar que pertenecen a esta sesión
        try {
          const data = JSON.parse(tokenData);
          if (data.sessionId === sessionId) {
            // Los datos pertenecen a este sessionId - reutilizar
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔐 Reutilizando sessionId válido: ${sessionId.substring(0, 20)}...`);
            }
            return sessionId;
          }
        } catch (e) {
          // Datos en formato antiguo - verificar que la clave existe
          // Si existe, asumir que es válido (migración)
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔐 Reutilizando sessionId (formato antiguo): ${sessionId.substring(0, 20)}...`);
          }
          return sessionId;
        }
      }

      // No hay datos para este sessionId - puede ser una pestaña duplicada
      // Verificar si hay CUALQUIER dato con este prefijo
      const hasAnyData = this.hasDataForSession(sessionId);

      if (!hasAnyData) {
        // No hay datos para este sessionId
        // Esto puede ser:
        // 1. Nueva pestaña sin login (normal) - reutilizar sessionId
        // 2. Pestaña duplicada (sessionStorage copiado pero localStorage no)
        // 
        // SOLUCIÓN: Si sessionStorage tiene sessionId pero localStorage no tiene datos,
        // y la pestaña se acaba de abrir (sin datos de sesión previos),
        // es muy probable que sea una duplicación. Crear nuevo sessionId.

        // Verificar si sessionInfo es reciente (menos de 1 segundo)
        // Si es muy reciente, es probable que sea una duplicación
        try {
          const sessionInfo = sessionStorage.getItem('app_session_info');
          if (sessionInfo) {
            const info = JSON.parse(sessionInfo);
            if (info.createdAt) {
              const created = new Date(info.createdAt);
              const now = new Date();
              const secondsDiff = (now - created) / 1000;

              // Si la sesión tiene menos de 2 segundos y no hay datos,
              // es muy probable que sea una duplicación
              if (secondsDiff < 2) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`⚠️ Posible pestaña duplicada detectada (sesión muy reciente sin datos). Creando nuevo sessionId...`);
                }
                // Crear nuevo sessionId
                sessionId = null; // Forzar creación de nuevo
              } else {
                // Sesión antigua sin datos - es una nueva pestaña normal
                if (process.env.NODE_ENV === 'development') {
                  console.log(`🔐 Reutilizando sessionId (nueva pestaña sin login): ${sessionId.substring(0, 20)}...`);
                }
                return sessionId;
              }
            }
          }
        } catch (e) {
          // Error parseando info - crear nuevo sessionId por seguridad
          sessionId = null;
        }
      } else {
        // Hay datos para este sessionId - reutilizar
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 Reutilizando sessionId con datos: ${sessionId.substring(0, 20)}...`);
        }
        return sessionId;
      }
    }

    // Crear nuevo sessionId (no existe o es una duplicación)
    if (!sessionId) {
      sessionId = this.createNewSessionId();

      try {
        // Limpiar sessionId anterior si existe (por si acaso)
        const oldSessionId = sessionStorage.getItem('app_session_id');
        if (oldSessionId && oldSessionId !== sessionId) {
          sessionStorage.removeItem('app_session_id');
          sessionStorage.removeItem('app_session_info');
        }

        // Guardar nuevo sessionId
        sessionStorage.setItem('app_session_id', sessionId);

        const sessionInfo = {
          id: sessionId,
          createdAt: new Date().toISOString(),
          userAgent: navigator.userAgent?.substring(0, 50) || 'unknown',
          role: null,
          windowId: `win_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          tabId: `tab_${performance.now()}_${Math.random().toString(36).substring(2, 9)}`
        };
        sessionStorage.setItem('app_session_info', JSON.stringify(sessionInfo));

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 ✅ Nueva sesión creada: ${sessionId.substring(0, 20)}...`);
        }
      } catch (e) {
        console.error('Error guardando sessionId:', e);
      }
    }

    return sessionId;
  }

  /**
   * Verifica si hay datos en localStorage para un sessionId dado
   */
  hasDataForSession(sessionId) {
    try {
      const prefix = `session_${sessionId}_`;
      const keys = Object.keys(localStorage);
      return keys.some(key => key.startsWith(prefix));
    } catch (e) {
      return false;
    }
  }

  /**
   * Obtiene información de la sesión actual
   */
  getSessionInfo() {
    const info = sessionStorage.getItem('app_session_info');
    return info ? JSON.parse(info) : null;
  }

  /**
   * Actualiza la información de la sesión (por ejemplo, el rol del usuario)
   */
  updateSessionInfo(updates) {
    const info = this.getSessionInfo();
    if (info) {
      const updated = { ...info, ...updates };
      sessionStorage.setItem('app_session_info', JSON.stringify(updated));
    }
  }

  /**
   * Obtiene el sessionId actual (lazy initialization)
   */
  get sessionId() {
    if (!this._sessionId) {
      this.init();
    }
    return this._sessionId;
  }

  /**
   * Obtiene el prefijo de almacenamiento (lazy initialization)
   */
  get storagePrefix() {
    if (!this._storagePrefix) {
      this.init();
    }
    return this._storagePrefix;
  }

  /**
   * Obtiene una clave prefijada para localStorage
   */
  getKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Guarda un valor en localStorage con prefijo de sesión
   * IMPORTANTE: Incluye la huella digital de la pestaña para detectar duplicaciones
   */
  setItem(key, value) {
    const prefixedKey = this.getKey(key);
    try {
      // Guardar con metadata que incluye sessionId y tabFingerprint
      const data = {
        value: value,
        sessionId: this.sessionId,
        tabFingerprint: this.getTabFingerprint(), // Identificador único de esta pestaña
        timestamp: Date.now()
      };
      localStorage.setItem(prefixedKey, JSON.stringify(data));

      if (process.env.NODE_ENV === 'development' && (key === 'user' || key === 'authToken')) {
        console.log(`💾 Guardado ${key} para sesión: ${this.sessionId.substring(0, 12)}..., tab: ${this.getTabFingerprint().substring(0, 12)}...`);
      }
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  /**
   * Obtiene un valor de localStorage con prefijo de sesión
   * Solo obtiene valores de esta sesión específica
   * CRÍTICO: Verifica que el sessionId Y tabFingerprint coincidan
   * Si tabFingerprint no coincide, es una pestaña duplicada y NO debe leer esos datos
   */
  getItem(key) {
    const prefixedKey = this.getKey(key);
    const currentSessionId = this.sessionId;
    const currentTabFingerprint = this.getTabFingerprint();

    try {
      const stored = localStorage.getItem(prefixedKey);
      if (!stored) {
        return null;
      }

      // Intentar parsear como JSON (nuevo formato con metadata)
      try {
        const data = JSON.parse(stored);

        // VERIFICACIÓN CRÍTICA: 
        // 1. El sessionId debe coincidir
        // 2. El tabFingerprint debe coincidir EXACTAMENTE
        // Si tabFingerprint no coincide, es una pestaña duplicada
        if (data.sessionId && data.sessionId === currentSessionId && data.value !== undefined) {
          // Si hay tabFingerprint almacenado, DEBE coincidir exactamente
          if (data.tabFingerprint) {
            if (data.tabFingerprint === currentTabFingerprint) {
              // Los datos pertenecen a esta pestaña específica
              if (process.env.NODE_ENV === 'development' && (key === 'user' || key === 'authToken')) {
                console.log(`📖 Leyendo ${key} de sesión: ${currentSessionId.substring(0, 12)}..., tab: ${currentTabFingerprint.substring(0, 12)}...`);
              }
              return data.value;
            } else {
              // Los datos pertenecen a otra pestaña (duplicación detectada)
              if (process.env.NODE_ENV === 'development') {
                console.warn(`⚠️ BLOQUEADO: Intento de leer datos de otra pestaña. Key: ${key}`);
                console.warn(`   SessionId: ${currentSessionId.substring(0, 12)}...`);
                console.warn(`   TabFingerprint actual: ${currentTabFingerprint.substring(0, 20)}...`);
                console.warn(`   TabFingerprint en datos: ${data.tabFingerprint.substring(0, 20)}...`);
                console.warn(`   ❌ Los datos NO se leerán - pestaña duplicada detectada`);
              }
              return null; // BLOQUEAR datos de otra pestaña
            }
          } else {
            // Datos antiguos sin tabFingerprint - migrar SOLO si sessionId coincide
            if (prefixedKey.startsWith(`session_${currentSessionId}_`)) {
              // Migrar agregando tabFingerprint actual
              try {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`🔄 Migrando dato antiguo ${key} con nuevo tabFingerprint`);
                }
                this.setItem(key, data.value); // Reescribir con metadata completa
                return data.value;
              } catch (migrationError) {
                console.warn('Error migrando dato antiguo:', migrationError);
                // Devolver el valor solo si sessionId coincide (datos antiguos)
                return data.value;
              }
            }
            return null;
          }
        }

        // SessionId no coincide - datos de otra sesión
        if (process.env.NODE_ENV === 'development' && data.sessionId && data.sessionId !== currentSessionId) {
          console.warn(`⚠️ Intento de leer datos de otra sesión. Key: ${key}, SessionId esperado: ${currentSessionId.substring(0, 12)}..., encontrado: ${data.sessionId.substring(0, 12)}...`);
        }

        return null;
      } catch (e) {
        // Si no es JSON, es un valor antiguo sin metadata
        // SOLO devolver si la clave empieza con nuestro prefijo actual
        if (stored && typeof stored === 'string' && prefixedKey.startsWith(`session_${currentSessionId}_`)) {
          // Migrar a nuevo formato
          try {
            this.setItem(key, stored);
            return stored;
          } catch (migrationError) {
            console.warn('Error migrando dato antiguo:', migrationError);
            return stored;
          }
        }
        return null;
      }
    } catch (e) {
      console.error('Error leyendo de localStorage:', e);
      return null;
    }
  }

  /**
   * Elimina un valor de localStorage con prefijo de sesión
   */
  removeItem(key) {
    const prefixedKey = this.getKey(key);
    try {
      localStorage.removeItem(prefixedKey);
    } catch (e) {
      console.error('Error eliminando de localStorage:', e);
    }
  }

  /**
   * Limpia todos los datos de esta sesión
   */
  clearSession() {
    // Obtener todas las claves de localStorage que pertenecen a esta sesión
    // Solo limpiar las que pertenecen a ESTA pestaña (mismo sessionId Y tabFingerprint)
    const keys = Object.keys(localStorage);
    const currentSessionId = this.sessionId;
    const currentTabFingerprint = this.getTabFingerprint();

    keys.forEach(key => {
      if (key.startsWith(`session_${currentSessionId}_`)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            // Solo eliminar si pertenece a esta pestaña específica
            if (data.sessionId === currentSessionId && data.tabFingerprint === currentTabFingerprint) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Si no es JSON, eliminar de todos modos (datos antiguos)
          localStorage.removeItem(key);
        }
      }
    });

    // Limpiar sessionStorage
    sessionStorage.removeItem('app_session_id');
    sessionStorage.removeItem('app_session_info');
    sessionStorage.removeItem('app_tab_fingerprint');

    // Resetear estado interno
    this._tabFingerprint = null;
  }

  /**
   * Obtiene todas las sesiones activas (útil para debugging)
   */
  getAllSessions() {
    const keys = Object.keys(localStorage);
    const sessions = new Set();

    keys.forEach(key => {
      if (key.startsWith('session_')) {
        // Extraer el sessionId correctamente (formato: session_sess_xxx_key)
        const parts = key.split('_');
        if (parts.length >= 3) {
          // El sessionId es sess_xxx (parts[1] + parts[2])
          const sessionId = parts.slice(1, 3).join('_');
          sessions.add(sessionId);
        }
      }
    });

    return Array.from(sessions);
  }

  /**
   * Obtiene el ID de sesión actual
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Verifica si un valor pertenece a esta sesión Y a esta pestaña específica
   */
  isMySession(key) {
    const prefixedKey = this.getKey(key);
    const currentSessionId = this.sessionId;
    const currentTabFingerprint = this.getTabFingerprint();

    try {
      const stored = localStorage.getItem(prefixedKey);
      if (!stored) return false;

      try {
        const data = JSON.parse(stored);
        // Verificar sessionId
        if (data.sessionId !== currentSessionId) {
          return false;
        }
        // Si hay tabFingerprint, DEBE coincidir exactamente
        if (data.tabFingerprint) {
          return data.tabFingerprint === currentTabFingerprint;
        }
        // Sin tabFingerprint - datos antiguos, asumir válido si sessionId coincide
        return true;
      } catch (e) {
        // Valores antiguos sin metadata
        // Solo devolver true si la clave coincide con nuestro prefijo
        return prefixedKey.startsWith(`session_${currentSessionId}_`);
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Verifica si hay otra sesión activa con el mismo usuario
   */
  hasOtherActiveSessions(userId) {
    const keys = Object.keys(localStorage);
    const otherSessions = [];

    keys.forEach(key => {
      if (key.startsWith('session_') && key.includes('_user')) {
        const sessionId = key.split('_')[1];
        if (sessionId !== this.sessionId) {
          const userData = localStorage.getItem(key);
          if (userData) {
            try {
              const user = JSON.parse(userData);
              if (user.id === userId) {
                otherSessions.push(sessionId);
              }
            } catch (e) {
              // Ignorar errores de parsing
            }
          }
        }
      }
    });

    return otherSessions.length > 0;
  }
}

// NO usar singleton - cada módulo debe crear su propia instancia
// pero sessionStorage asegurará que cada pestaña tenga su propio ID
// Exportar la clase directamente para que cada importación cree su instancia
// pero usando sessionStorage compartido por pestaña

// Crear una instancia única por contexto de ejecución (módulo)
// Esto es seguro porque sessionStorage es único por pestaña
let sessionManagerInstance = null;

function createSessionManager() {
  // Si ya existe una instancia en este contexto, reutilizarla
  // Pero sessionStorage asegurará que cada pestaña tenga datos únicos
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

// Exportar función factory
export default createSessionManager;

