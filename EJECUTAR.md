# 🚀 Cómo Ejecutar ClassPad

## Ejecución Rápida

### Opción 1: Desde el directorio raíz (Recomendado)
```bash
# En el directorio raíz del proyecto
npm run dev
```

### Opción 2: Desde el directorio web
```bash
# Navegar al directorio web
cd web
npm run dev
```

## ✅ La aplicación debería estar funcionando en:
**http://localhost:5173**

## 🔧 Si encuentras errores:

### Error: "Could not read package.json"
- **Solución**: Asegúrate de estar en el directorio correcto
- **Comando**: `cd Sistema-Tesis-classpad-` y luego `npm run dev`

### Error: "Dependencias faltantes"
- **Solución**: Instalar dependencias
- **Comando**: `npm run install:all`

### Error: "Firebase no configurado"
- **Solución**: La aplicación funcionará en modo demo
- **Para funcionalidad completa**: Configura Firebase siguiendo `INSTALACION.md`

## 📱 Funcionalidades Disponibles (Modo Demo)

✅ **Interfaz de usuario completa**
✅ **Navegación entre páginas**
✅ **Formularios de login/registro**
✅ **Dashboard principal**
✅ **Perfil de usuario**
✅ **Configuración**

⚠️ **Funcionalidades que requieren Firebase** (no funcionarán en demo):
- Autenticación real
- Base de datos
- Subida de archivos
- Sistema de QR

## 🔥 Para funcionalidad completa:

1. **Configura Firebase** siguiendo `INSTALACION.md`
2. **Reemplaza las credenciales** en `web/src/config/firebase.ts`
3. **Despliega las Cloud Functions**

## 📞 Soporte

Si tienes problemas:
1. Verifica que estás en el directorio correcto
2. Ejecuta `npm run install:all`
3. Revisa la consola del navegador para errores
4. Consulta `INSTALACION.md` para configuración completa 