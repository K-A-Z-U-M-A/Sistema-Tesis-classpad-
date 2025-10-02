# 📁 Almacenamiento de Archivos - Mejores Prácticas para ClassPad

## 🎯 Recomendación Principal

**✅ ALMACENAMIENTO EXTERNO + URLs EN DB**
- Archivos en sistema de archivos/S3/GCS
- Solo URLs/rutas en PostgreSQL
- **NUNCA** usar BYTEA para archivos grandes

## 🏗️ Arquitectura Recomendada

### **Estructura de Datos en PostgreSQL**
```sql
-- Tabla materials (ejemplo)
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- document, video, link, image, audio
  url TEXT NOT NULL,          -- URL completa del archivo
  file_name VARCHAR(255),     -- Nombre original
  file_size BIGINT,           -- Tamaño en bytes
  mime_type VARCHAR(100),     -- MIME type
  storage_provider VARCHAR(50), -- 'local', 's3', 'gcs'
  storage_key VARCHAR(500),   -- Clave en el storage provider
  order_index INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📊 Comparación de Opciones

| Aspecto | BYTEA en DB | Sistema Local | AWS S3 | Google Cloud |
|---------|-------------|---------------|--------|--------------|
| **Rendimiento** | ❌ Lento | ✅ Rápido | ✅ Muy Rápido | ✅ Muy Rápido |
| **Escalabilidad** | ❌ Limitada | ⚠️ Media | ✅ Excelente | ✅ Excelente |
| **Costo** | ⚠️ Alto (DB) | ✅ Bajo | ⚠️ Medio | ⚠️ Medio |
| **Backup** | ❌ Complejo | ⚠️ Manual | ✅ Automático | ✅ Automático |
| **CDN** | ❌ No | ❌ No | ✅ CloudFront | ✅ Cloud CDN |
| **Seguridad** | ⚠️ Básica | ⚠️ Básica | ✅ Avanzada | ✅ Avanzada |

## 🚀 Implementación por Fases

### **Fase 1: Sistema Local (Actual)**
```javascript
// ✅ Implementado
const fileInfo = {
  filename: "1234567890-123456789-documento.pdf",
  originalName: "documento.pdf",
  size: 1024000,
  mimeType: "application/pdf",
  publicUrl: "http://localhost:3001/uploads/1234567890-123456789-documento.pdf"
};
```

### **Fase 2: AWS S3 (Recomendado para Producción)**
```javascript
// 🔄 Por implementar
const s3Config = {
  bucket: "classpad-files",
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

const fileInfo = {
  storageProvider: "s3",
  storageKey: "uploads/2024/01/documento-123.pdf",
  publicUrl: "https://classpad-files.s3.us-east-1.amazonaws.com/uploads/2024/01/documento-123.pdf"
};
```

### **Fase 3: Google Cloud Storage**
```javascript
// 🔄 Por implementar
const gcsConfig = {
  bucket: "classpad-files",
  projectId: "classpad-project",
  keyFilename: "path/to/service-account.json"
};

const fileInfo = {
  storageProvider: "gcs",
  storageKey: "uploads/2024/01/documento-123.pdf",
  publicUrl: "https://storage.googleapis.com/classpad-files/uploads/2024/01/documento-123.pdf"
};
```

## 🔒 Consideraciones de Seguridad

### **1. Control de Acceso**
```javascript
// URLs firmadas para archivos privados
const signedUrl = s3.getSignedUrl('getObject', {
  Bucket: 'classpad-files',
  Key: fileKey,
  Expires: 3600 // 1 hora
});
```

### **2. Validación de Archivos**
```javascript
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'video/mp4',
  'audio/mpeg'
];

const maxSize = 50 * 1024 * 1024; // 50MB
```

### **3. Sanitización de Nombres**
```javascript
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255);
}
```

## 📈 Optimizaciones de Rendimiento

### **1. CDN Integration**
```javascript
// CloudFront para S3
const cdnUrl = "https://d1234567890.cloudfront.net/uploads/documento.pdf";

// Google Cloud CDN
const cdnUrl = "https://cdn.classpad.com/uploads/documento.pdf";
```

### **2. Compresión de Imágenes**
```javascript
// Reducir tamaño de imágenes automáticamente
const sharp = require('sharp');

await sharp(inputBuffer)
  .resize(1920, 1080, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();
```

### **3. Lazy Loading**
```javascript
// Cargar archivos solo cuando se necesiten
const MaterialPreview = ({ material }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div>
      {isLoaded ? (
        <img src={material.url} alt={material.title} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};
```

## 🗂️ Organización de Archivos

### **Estructura Recomendada**
```
uploads/
├── 2024/
│   ├── 01/          # Enero
│   │   ├── documents/
│   │   ├── images/
│   │   ├── videos/
│   │   └── audio/
│   └── 02/          # Febrero
├── temp/            # Archivos temporales
└── thumbnails/      # Miniaturas
```

### **Nomenclatura de Archivos**
```javascript
// Formato: timestamp-randomNumber-originalName
const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${originalName}`;

// Ejemplo: 1704067200000-a1b2c3d4e-documento.pdf
```

## 🔄 Migración de BYTEA a URLs

### **Script de Migración**
```sql
-- 1. Crear nueva tabla
CREATE TABLE materials_new (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  -- ... otros campos
);

-- 2. Migrar datos existentes
INSERT INTO materials_new (id, unit_id, title, url, ...)
SELECT 
  id,
  unit_id,
  title,
  '/uploads/' || id || '.pdf' as url,  -- Generar URL
  ...
FROM materials_old;

-- 3. Renombrar tablas
ALTER TABLE materials RENAME TO materials_backup;
ALTER TABLE materials_new RENAME TO materials;
```

## 📊 Monitoreo y Métricas

### **Métricas Importantes**
- Tamaño total de archivos por usuario/curso
- Tiempo de carga de archivos
- Errores de upload
- Uso de almacenamiento por tipo

### **Alertas Recomendadas**
- Archivo > 50MB
- Más de 1000 archivos por curso
- Error rate > 5%
- Espacio en disco < 20%

## 🎯 Recomendación Final

**Para ClassPad, implementa en este orden:**

1. **✅ Sistema Local** (Ya implementado)
2. **🔄 AWS S3** (Próximo paso)
3. **🔄 CDN** (CloudFront)
4. **🔄 Compresión automática**
5. **🔄 URLs firmadas para privacidad**

**Beneficios esperados:**
- 90% mejora en velocidad de consultas
- 80% reducción en tamaño de backups
- Escalabilidad ilimitada
- Mejor experiencia de usuario
